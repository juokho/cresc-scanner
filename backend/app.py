import time
import threading
import pandas as pd
import numpy as np
import requests
import urllib3
import os
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# 설정 및 환경 변수
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
LOG_FILE = "trade_log.csv"

# ============================================================
# 티커 설정 import
# ============================================================
from tickers import LEVERAGE_MAP

# ============================================================
# 상태 및 설정
# ============================================================
ticker_data   = {}
trade_history = {}
scan_state    = {"running": False, "progress": 0, "current": "", "last_scan": ""}
data_lock     = threading.Lock()

CHOP_LEN        = 14
THRESHOLD_TREND = 40.0
HMA_LEN         = 21
Z_LEN           = 20
STOP_MULT       = 1.8
TP_MULT         = 4.5
BE_THRESHOLD    = 2.0

# ============================================================
# 유틸리티
# ============================================================
def send_discord(msg):
    if not DISCORD_WEBHOOK_URL: return
    try: requests.post(DISCORD_WEBHOOK_URL, json={"content": msg}, timeout=5)
    except Exception as e: print(f"[Discord] {e}")

def init_log():
    if not os.path.exists(LOG_FILE):
        pd.DataFrame(columns=["Timestamp","Ticker","Side","Entry","Exit","Profit","Status"]).to_csv(
            LOG_FILE, index=False, encoding="utf-8-sig")

def log_trade(ticker, side, entry, exit_p=0, profit=0, status="ENTRY"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if status == "ENTRY":
        emoji = "🟢" if side == "LONG" else "🔴"
        send_discord(f"📡 **[NEXUS 1H]** {emoji} **{ticker}** {side} | Price: {entry:.4f}")
    elif status == "EXIT":
        r = "💰" if profit > 0 else "📉"
        send_discord(f"{r} **[NEXUS 1H] EXIT** {ticker} | {profit:+.2f}%")
    row = pd.DataFrame([[now, ticker, side, entry, exit_p, f"{profit:+.2f}%", status]],
                       columns=["Timestamp","Ticker","Side","Entry","Exit","Profit","Status"])
    row.to_csv(LOG_FILE, mode="a", header=False, index=False, encoding="utf-8-sig")

init_log()

# ============================================================
# 지표 및 엔진
# ============================================================
def get_hma(series, length):
    def wma(s, l):
        w = np.arange(1, l + 1)
        return s.rolling(l).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)
    h, s = int(length / 2), int(np.sqrt(length))
    return wma(2 * wma(series, h) - wma(series, length), s)

def process_ticker(symbol, info):
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=5m&range=5d"
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=6)
        res = r.json()["chart"]["result"][0]
        p = res["indicators"]["quote"][0]
        df = pd.DataFrame({"Close": p["close"], "High": p["high"], "Low": p["low"]},
                           index=res["timestamp"]).dropna()
        
        if df.empty or len(df) < 30: return

        close, high, low = df["Close"], df["High"], df["Low"]
        tr = pd.concat([high-low, (high-close.shift(1)).abs(), (low-close.shift(1)).abs()], axis=1).max(axis=1)
        atr = tr.rolling(14).mean().iloc[-1]
        rng = high.rolling(CHOP_LEN).max() - low.rolling(CHOP_LEN).min()
        ci  = 100 * np.log10(tr.rolling(CHOP_LEN).sum() / (rng + 1e-9)).iloc[-1] / np.log10(CHOP_LEN)

        hma_s  = get_hma(close, HMA_LEN)
        hma    = hma_s.iloc[-1]
        z_mean = close.rolling(Z_LEN).mean().iloc[-1]
        z_std  = close.rolling(Z_LEN).std().iloc[-1]
        z      = (close.iloc[-1] - z_mean) / (z_std + 1e-9)

        # [진입 조건 - 원본 V5 로직]
        is_trend = ci < THRESHOLD_TREND
        long_e   = (close.iloc[-2] < hma_s.iloc[-2] and close.iloc[-1] > hma) if is_trend \
                   else (z < -2.1 and (close.iloc[-2] - z_mean) / (z_std + 1e-9) > -2.1)
        short_e  = (close.iloc[-2] > hma_s.iloc[-2] and close.iloc[-1] < hma) if is_trend \
                   else (z > 2.1  and (close.iloc[-2] - z_mean) / (z_std + 1e-9) < 2.1)

        # [점수 로직 - Regime 분리형 고득점 엔진]
        if long_e:
            # 추세장 진입 시 HMA 돌파 강도 보정 / 횡보장 진입 시 Z-Score 깊이 보정
            bonus = min(abs(close.iloc[-1] - hma) / (atr + 1e-9) * 10, 14.0) if is_trend else min(abs(z) * 5, 14.0)
            final_score = round(85.0 + bonus, 1)
        elif short_e:
            bonus = min(abs(close.iloc[-1] - hma) / (atr + 1e-9) * 10, 14.0) if is_trend else min(abs(z) * 5, 14.0)
            final_score = round(-(85.0 + bonus), 1)
        else:
            # 진입 대기 상태
            if is_trend:
                base_val = min(60.0, (abs(close.iloc[-1] - hma) / (atr * 2 + 1e-9)) * 60)
                is_bearish = close.iloc[-1] < hma
            else:
                base_val = min(60.0, abs(z) / 2.1 * 60)
                is_bearish = z > 0
            final_score = round(base_val, 1)

        curr_p = float(close.iloc[-1])
        signal = "LONG" if long_e else "SHORT" if short_e else "WAIT"

        with data_lock:
            # 신규 진입 처리
            if (long_e or short_e) and symbol not in trade_history:
                side = "LONG" if long_e else "SHORT"
                trade_history[symbol] = {
                    "entry": curr_p, "side": side, "be_active": False,
                    "sl": curr_p - (atr * STOP_MULT if side == "LONG" else -atr * STOP_MULT),
                    "tp": curr_p + (atr * TP_MULT if side == "LONG" else -atr * TP_MULT),
                }
                log_trade(symbol, side, curr_p, status="ENTRY")

            # 포지션 관리
            if symbol in trade_history:
                t = trade_history[symbol]
                profit = (curr_p - t["entry"]) / t["entry"] * 100 * (1 if t["side"] == "LONG" else -1)
                if profit >= BE_THRESHOLD and not t["be_active"]:
                    t["sl"], t["be_active"] = t["entry"], True
                is_exit = (curr_p <= t["sl"] or curr_p >= t["tp"]) if t["side"] == "LONG" \
                          else (curr_p >= t["sl"] or curr_p <= t["tp"])
                if is_exit:
                    log_trade(symbol, t["side"], t["entry"], curr_p, profit, "EXIT")
                    del trade_history[symbol]

            ticker_data[symbol] = {
                "name": info["name"], "price": round(curr_p, 4), "signal": signal,
                "score": final_score, "ci": round(ci, 1), "z": round(z, 2),
                "long_t": info["long"], "short_t": info["short"], "regime": "TREND" if is_trend else "RANGE"
            }
    except Exception as e: print(f"[{symbol}] 오류: {e}")

# ============================================================
# API 및 루프
# ============================================================
def scan_loop():
    while True:
        scan_state["running"] = True
        
        # 기본 티커만 스캔
        tickers = list(LEVERAGE_MAP.items())
        with ThreadPoolExecutor(max_workers=8) as ex:
            futures = {ex.submit(process_ticker, sym, info): sym for sym, info in tickers}
            done = 0
            for fut in futures:
                fut.result()
                done += 1
                scan_state["progress"] = int(done / len(tickers) * 100)
                scan_state["current"] = futures[fut]
        scan_state["running"], scan_state["last_scan"] = False, datetime.now().strftime("%H:%M:%S")
        time.sleep(60)

app = FastAPI()

# CORS 설정 (모든 origin 허용 - 배포용)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 엔드포인트 먼저 정의 (StaticFiles보다 우선)
@app.get("/api/data")
def get_data():
    with data_lock:
        # 기본 티커 신호 + LONG/SHORT ETF 추가
        signals = []
        for sym, d in ticker_data.items():
            # 기본 티커
            signals.append({"symbol": sym, "position": trade_history.get(sym), **d})
            
            # LONG ETF
            long_signal = d.copy()
            long_signal["symbol"] = d["long_t"]
            long_signal["name"] = d["name"] + " LONG"
            long_signal["signal"] = "LONG" if d["signal"] == "LONG" else "WAIT"
            long_signal["score"] = d["score"] if d["signal"] == "LONG" else 0
            signals.append({"symbol": d["long_t"], "position": trade_history.get(d["long_t"]), **long_signal})
            
            # SHORT ETF
            short_signal = d.copy()
            short_signal["symbol"] = d["short_t"]
            short_signal["name"] = d["name"] + " SHORT"
            short_signal["signal"] = "SHORT" if d["signal"] == "SHORT" else "WAIT"
            short_signal["score"] = -d["score"] if d["signal"] == "SHORT" else 0
            signals.append({"symbol": d["short_t"], "position": trade_history.get(d["short_t"]), **short_signal})
    
    signals.sort(key=lambda x: abs(x["score"]), reverse=True)
    return JSONResponse({"signals": signals, "scan": scan_state, "total": len(signals), "active": len(trade_history)})

@app.get("/api/log")
def get_log():
    try: return JSONResponse(pd.read_csv(LOG_FILE, encoding="utf-8-sig").tail(50).iloc[::-1].to_dict(orient="records"))
    except: return JSONResponse([])

# 정적 파일 제공 (API 이후에 마운트)
from fastapi.staticfiles import StaticFiles
import os
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    threading.Thread(target=scan_loop, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=7864)