import time
import threading
import pandas as pd
import numpy as np
import requests
import urllib3
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# ── 설정 및 환경 변수 ──────────────────────────────────────────
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

DISCORD_WEBHOOK_URL  = os.getenv("DISCORD_WEBHOOK_URL", "")
SUPABASE_URL         = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
PREMIUM_API_KEYS     = [k.strip() for k in os.getenv("PREMIUM_API_KEYS", "").split(",") if k.strip()]

from tickers import LEVERAGE_MAP

# ── 공유 상태 ─────────────────────────────────────────────────
ticker_data    = {"5m": {}, "30m": {}, "1h": {}, "1d": {}}
trade_history  = {"5m": {}, "30m": {}, "1h": {}, "1d": {}}  # 서버 메모리 내 활성 포지션
scan_state     = {
    "5m":  {"running": False, "progress": 0, "last_scan": ""},
    "1d":  {"running": False, "progress": 0, "last_scan": ""}
}
data_lock = threading.Lock()

# 지표 파라미터
CHOP_LEN, THRESHOLD_TREND = 48, 40.0
HMA_LEN, Z_LEN, ATR_LEN   = 55, 50, 48
STOP_MULT, TP_MULT        = 2.5, 5.0
BE_THRESHOLD              = 1.5  # 1.5% 수익 시 본절가(BE)로 손절매 이동

TIMEFRAME_CONFIG = {
    "5m":  {"interval": "5m",  "range": "5d",   "workers": 6,  "sleep": 60},
    "1d":  {"interval": "1d",  "range": "1y",   "workers": 2,  "sleep": 86400},
}

# ── 1. 인증 로직 단순화 ────────────────────────────────────────
def verify_token(request: Request):
    x_api_key = request.headers.get("x-api-key")
    auth_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    
    # Premium 체크 (API Key 혹은 Supabase 토큰)
    if x_api_key in PREMIUM_API_KEYS:
        return {"is_premium": True, "tier": "premium"}
    
    if auth_token and SUPABASE_URL:
        try:
            res = requests.get(f"{SUPABASE_URL}/auth/v1/user", 
                               headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {auth_token}"}, timeout=3)
            if res.status_code == 200:
                return {"is_premium": True, "tier": "premium"}
        except: pass
    
    return {"is_premium": False, "tier": "free"}

# ── 2. Supabase DB 연동 및 포지션 관리 ─────────────────────────
def db_request(method, path, json=None, params=None):
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY): return None
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "application/json"}
    try:
        url = f"{SUPABASE_URL}/rest/v1/{path}"
        if method == "GET": return requests.get(url, headers=headers, params=params, timeout=5).json()
        if method == "POST": return requests.post(url, headers=headers, json=json, timeout=5)
        if method == "PATCH": return requests.patch(url, headers=headers, json=json, params=params, timeout=5)
    except Exception as e:
        print(f"[DB Error] {e}")
    return None

def load_positions_from_db():
    """서버 재시작 시 활성 포지션 복원"""
    for tf in trade_history.keys():
        data = db_request("GET", "scanner_positions", params={"status": "eq.ACTIVE", "timeframe": f"eq.{tf}"})
        if data:
            with data_lock:
                for pos in data:
                    trade_history[tf][pos["symbol"]] = {
                        "entry": float(pos["entry_price"]), "side": pos["side"],
                        "sl": float(pos["sl_price"]), "tp": float(pos["tp_price"]),
                        "be_active": pos.get("be_active", False)
                    }
            print(f"[Restore] {len(data)} positions loaded for {tf}")

# ── 3. 지표 및 데이터 처리 ─────────────────────────────────────
def get_hma(series, length):
    def wma(s, l):
        w = np.arange(1, l + 1)
        return s.rolling(l).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)
    h, s = int(length / 2), int(np.sqrt(length))
    return wma(2 * wma(series, h) - wma(series, length), s)

def process_ticker(symbol, info, timeframe):
    config = TIMEFRAME_CONFIG.get(timeframe)
    try:
        r = requests.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval={config['interval']}&range={config['range']}",
                         headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=10)
        res = r.json()["chart"]["result"][0]
        df = pd.DataFrame({"Close": res["indicators"]["quote"][0]["close"], 
                           "High": res["indicators"]["quote"][0]["high"], 
                           "Low": res["indicators"]["quote"][0]["low"]}).dropna()
    except: return

    close, high, low = df["Close"], df["High"], df["Low"]
    tr = pd.concat([high-low, (high-close.shift(1)).abs(), (low-close.shift(1)).abs()], axis=1).max(axis=1)
    atr = tr.ewm(alpha=1/ATR_LEN, adjust=False).mean().iloc[-1]
    ci = (100 * np.log10(tr.rolling(CHOP_LEN).sum() / ((high.rolling(CHOP_LEN).max() - low.rolling(CHOP_LEN).min()) + 1e-9)) / np.log10(CHOP_LEN)).iloc[-1]
    
    hma_s = get_hma(close, HMA_LEN)
    z = (close.iloc[-1] - close.rolling(Z_LEN).mean().iloc[-1]) / (close.rolling(Z_LEN).std().iloc[-1] + 1e-9)
    
    is_trend, curr_p = ci < THRESHOLD_TREND, float(close.iloc[-1])
    
    # 시그널 판정
    long_e = (close.iloc[-2] < hma_s.iloc[-2] and close.iloc[-1] > hma_s.iloc[-1]) if is_trend else (z < -2.1)
    short_e = (close.iloc[-2] > hma_s.iloc[-2] and close.iloc[-1] < hma_s.iloc[-1]) if is_trend else (z > 2.1)
    signal = "LONG" if long_e else "SHORT" if short_e else "WAIT"

    # 결과 저장
    with data_lock:
        ticker_data[timeframe][symbol] = {
            "name": info["name"], "price": round(curr_p, 4), "signal": signal,
            "score": round((85 if long_e else -85 if short_e else 0), 1), "regime": "TREND" if is_trend else "RANGE"
        }

        # ── 4. TP/SL 및 본절가(BE) 로직 ──────────────────────────
        if symbol in trade_history[timeframe]:
            pos = trade_history[timeframe][symbol]
            pnl = (curr_p - pos["entry"]) / pos["entry"] * 100 * (1 if pos["side"] == "LONG" else -1)
            
            # 본절가 이동 (Breakeven)
            if pnl >= BE_THRESHOLD and not pos["be_active"]:
                pos["sl"], pos["be_active"] = pos["entry"], True
                db_request("PATCH", "scanner_positions", {"sl_price": pos["entry"], "be_active": True}, 
                           params={"symbol": f"eq.{symbol}", "timeframe": f"eq.{timeframe}", "status": "eq.ACTIVE"})

            # 종료 체크 (TP/SL)
            hit_sl = (curr_p <= pos["sl"]) if pos["side"] == "LONG" else (curr_p >= pos["sl"])
            hit_tp = (curr_p >= pos["tp"]) if pos["side"] == "LONG" else (curr_p <= pos["tp"])

            if hit_sl or hit_tp:
                db_request("PATCH", "scanner_positions", 
                           {"status": "CLOSED", "exit_price": curr_p, "realized_pnl": round(pnl, 2), "close_reason": "TP" if hit_tp else "SL"},
                           params={"symbol": f"eq.{symbol}", "timeframe": f"eq.{timeframe}", "status": "eq.ACTIVE"})
                del trade_history[timeframe][symbol]

        # 새 포지션 진입
        elif signal != "WAIT":
            sl = curr_p - (atr * STOP_MULT if signal == "LONG" else -atr * STOP_MULT)
            tp = curr_p + (atr * TP_MULT if signal == "LONG" else -atr * TP_MULT)
            trade_history[timeframe][symbol] = {"entry": curr_p, "side": signal, "sl": sl, "tp": tp, "be_active": False}
            db_request("POST", "scanner_positions", 
                       {"symbol": symbol, "name": info["name"], "timeframe": timeframe, "side": signal, 
                        "entry_price": curr_p, "sl_price": sl, "tp_price": tp, "status": "ACTIVE"})

# ── 5. 백그라운드 루프 & FastAPI ─────────────────────────────
def scan_loop(tf):
    while True:
        scan_state[tf]["running"] = True
        tickers = list(LEVERAGE_MAP.items())
        with ThreadPoolExecutor(max_workers=TIMEFRAME_CONFIG[tf]["workers"]) as ex:
            done = 0
            futures = {ex.submit(process_ticker, s, i, tf): s for s, i in tickers}
            for _ in as_completed(futures):
                done += 1
                scan_state[tf]["progress"] = int(done / len(tickers) * 100)
        scan_state[tf]["running"], scan_state[tf]["last_scan"] = False, datetime.now().strftime("%H:%M:%S")
        time.sleep(TIMEFRAME_CONFIG[tf]["sleep"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_positions_from_db()  # 서버 시작 시 포지션 복원
    for tf in ["5m", "1d"]:
        threading.Thread(target=scan_loop, args=(tf,), daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/data")
def get_data(tf: str = "5m", auth: dict = Depends(verify_token)):
    target_tf = tf.lower() if tf.lower() in trade_history else "5m"
    
    # ── 6. Supabase DB 실시간 조회 반영 ───────────────────────
    # 메모리에 없는 최신 포지션 상태를 DB에서 직접 조회하여 클라이언트에 제공
    db_positions = db_request("GET", "scanner_positions", params={"status": "eq.ACTIVE", "timeframe": f"eq.{target_tf}"})
    pos_map = {p["symbol"]: p for p in db_positions} if db_positions else {}

    with data_lock:
        signals = []
        for sym, d in ticker_data.get(target_tf, {}).items():
            entry = {"symbol": sym, **d}
            if auth["is_premium"]:
                entry["position"] = pos_map.get(sym)
            signals.append(entry)

    signals.sort(key=lambda x: abs(x["score"]), reverse=True)
    return {"signals": signals, "scan": scan_state.get(target_tf), "tier": auth["tier"]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)