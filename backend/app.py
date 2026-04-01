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
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

DISCORD_WEBHOOK_URL  = os.getenv("DISCORD_WEBHOOK_URL", "")
SUPABASE_URL         = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
PREMIUM_API_KEYS     = [k.strip() for k in os.getenv("PREMIUM_API_KEYS", "").split(",") if k.strip()]
LOG_FILE = "trade_log.csv"

# ── 인증 ─────────────────────────────────────────────────────
def verify_token(x_api_key: str = Header(default=""), x_tier: str = Header(default="free")) -> dict:
    """간단한 tier 검증 - 헤더에서 직접 tier 확인 후 subscriptions 테이블로 검증"""
    print(f"[DEBUG] verify_token called with API key: {x_api_key[:10]}..., tier header: {x_tier}")
    is_premium, tier = False, x_tier or "free"
    
    # API 키가 있으면 Supabase에서 검증 (subscriptions 테이블 사용)
    if x_api_key and SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            res = requests.get(
                f"{SUPABASE_URL}/rest/v1/api_keys?api_key=eq.{x_api_key}&is_active=eq.true&select=tier",
                headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"},
                timeout=3,
            )
            print(f"[DEBUG] Supabase response: status={res.status_code}, data={res.json()}")
            if res.status_code == 200 and res.json():
                tier = res.json()[0].get("tier", "free")
                is_premium = tier == "premium"
        except Exception as e:
            print(f"[Auth] Error: {e}")
    else:
        print(f"[DEBUG] Missing: x_api_key={bool(x_api_key)}, SUPABASE_URL={bool(SUPABASE_URL)}, SUPABASE_SERVICE_KEY={bool(SUPABASE_SERVICE_KEY)}")
    
    # 환경변수 PREMIUM_API_KEYS도 체크 (하위호환)
    if x_api_key and x_api_key in PREMIUM_API_KEYS:
        is_premium, tier = True, "premium"
    
    print(f"[DEBUG] verify_token result: tier={tier}, is_premium={is_premium}")
    return {"token": x_api_key, "is_premium": is_premium, "tier": tier}

def require_premium(auth: dict = Depends(verify_token)):
    if not auth["is_premium"]:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return auth

from tickers import LEVERAGE_MAP
from trading import close_all_positions_for_user

# ── 공유 상태 ─────────────────────────────────────────────────
ticker_data    = {"5m": {}, "30m": {}, "1h": {}, "1d": {}}
trade_history  = {"5m": {}, "30m": {}, "1h": {}, "1d": {}}  # 시간대별 포지션 분리
processing_set = set()
failed_tickers = {}  # 실패한 티커 추적 {symbol: retry_count}
scan_state     = {"5m": {"running": False, "progress": 0, "current": "", "last_scan": ""},
                  "30m": {"running": False, "progress": 0, "current": "", "last_scan": ""},
                  "1h":  {"running": False, "progress": 0, "current": "", "last_scan": ""},
                  "1d":  {"running": False, "progress": 0, "current": "", "last_scan": ""}}
data_lock      = threading.Lock()

# ============================================================
# Supabase 포지션 저장/로드 함수
# ============================================================
def save_position_to_supabase(symbol: str, name: str, timeframe: str, side: str, 
                               entry: float, sl: float, tp: float, status: str = "ACTIVE"):
    """새 포지션을 Supabase에 저장"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/scanner_positions",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "symbol": symbol,
                "name": name,
                "timeframe": timeframe,
                "side": side,
                "entry_price": entry,
                "current_price": entry,
                "sl_price": sl,
                "tp_price": tp,
                "status": status
            },
            timeout=5
        )
        if res.status_code == 201:
            data = res.json()
            print(f"[SUPABASE] Position saved: {symbol} [{timeframe}] {side} @ {entry}")
            return data[0] if data else None
        else:
            print(f"[SUPABASE ERROR] Save failed: {res.status_code} - {res.text}")
            return None
    except Exception as e:
        print(f"[SUPABASE ERROR] save_position: {e}")
        return None

def update_position_in_supabase(symbol: str, timeframe: str, updates: dict):
    """기존 포지션 업데이트 (SL/TP/가격 등)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return False
    
    try:
        res = requests.patch(
            f"{SUPABASE_URL}/rest/v1/scanner_positions?symbol=eq.{symbol}&timeframe=eq.{timeframe}&status=eq.ACTIVE",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json=updates,
            timeout=5
        )
        if res.status_code == 204:
            print(f"[SUPABASE] Position updated: {symbol} [{timeframe}] {updates}")
            return True
        return False
    except Exception as e:
        print(f"[SUPABASE ERROR] update_position: {e}")
        return False

def close_position_in_supabase(symbol: str, timeframe: str, exit_price: float, 
                                realized_pnl: float, reason: str = "SL"):
    """포지션 청산 (EXIT)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return False
    
    try:
        res = requests.patch(
            f"{SUPABASE_URL}/rest/v1/scanner_positions?symbol=eq.{symbol}&timeframe=eq.{timeframe}&status=eq.ACTIVE",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "status": "CLOSED",
                "exit_time": datetime.now().isoformat(),
                "exit_price": exit_price,
                "realized_pnl": realized_pnl,
                "close_reason": reason
            },
            timeout=5
        )
        if res.status_code == 204:
            print(f"[SUPABASE] Position closed: {symbol} [{timeframe}] PnL={realized_pnl:.2f}%")
            return True
        return False
    except Exception as e:
        print(f"[SUPABASE ERROR] close_position: {e}")
        return False

def load_active_positions_from_supabase(timeframe: str = None) -> dict:
    """Supabase에서 활성 포지션 로드 (서버 재시작 시 복원)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {}
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/scanner_positions?status=eq.ACTIVE"
        if timeframe:
            url += f"&timeframe=eq.{timeframe}"
        url += "&select=*"
        
        res = requests.get(
            url,
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            },
            timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            positions = {}
            for pos in data:
                key = f"{pos['symbol']}:{pos['timeframe']}"
                positions[key] = {
                    "symbol": pos["symbol"],
                    "timeframe": pos["timeframe"],
                    "side": pos["side"],
                    "entry": float(pos["entry_price"]),
                    "current_price": float(pos["current_price"]) if pos["current_price"] else float(pos["entry_price"]),
                    "sl": float(pos["sl_price"]),
                    "tp": float(pos["tp_price"]),
                    "be_active": pos["be_active"],
                    "entry_time": pos["entry_time"],
                    "supabase_id": pos["id"]
                }
            print(f"[SUPABASE] Loaded {len(positions)} active positions")
            return positions
        return {}
    except Exception as e:
        print(f"[SUPABASE ERROR] load_positions: {e}")
        return {}

def save_signal_to_history(symbol: str, name: str, timeframe: str, signal_type: str,
                            price: float, score: float, ci: float, z: float, regime: str):
    """모든 시그널을 히스토리에 저장"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/scanner_signals_history",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "symbol": symbol,
                "name": name,
                "timeframe": timeframe,
                "signal_type": signal_type,
                "price": price,
                "score": score,
                "ci": ci,
                "z_score": z,
                "regime": regime
            },
            timeout=3
        )
    except:
        pass  # 히스토리 저장 실패는 무시

# ── 파라미터 (5m 기준 재조정) ─────────────────────────────────
CHOP_LEN        = 48
THRESHOLD_TREND = 40.0
HMA_LEN         = 55
Z_LEN           = 50
ATR_LEN         = 48
STOP_MULT       = 2.5
TP_MULT         = 5.0
BE_THRESHOLD    = 1.5

# ── 유틸 ─────────────────────────────────────────────────────
def send_discord(msg, is_premium=False):
    if not DISCORD_WEBHOOK_URL or not is_premium:
        return
    try:
        requests.post(DISCORD_WEBHOOK_URL, json={"content": msg}, timeout=5)
    except Exception as e:
        print(f"[Discord] {e}")

def init_log():
    if not os.path.exists(LOG_FILE):
        pd.DataFrame(columns=["Timestamp","Ticker","Side","Entry","Exit","Profit","Status"]).to_csv(
            LOG_FILE, index=False, encoding="utf-8-sig")

def log_trade(ticker, side, entry, exit_p=0, profit=0, status="ENTRY", is_premium=False):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if status == "ENTRY":
        send_discord(f"📡 **[5m]** {'🟢' if side=='LONG' else '🔴'} **{ticker}** {side} | ${entry:.4f}", is_premium)
    elif status == "EXIT":
        send_discord(f"{'💰' if profit>0 else '📉'} **[EXIT]** {ticker} | {profit:+.2f}%", is_premium)
    pd.DataFrame([[now, ticker, side, entry, exit_p, f"{profit:+.2f}%", status]],
                 columns=["Timestamp","Ticker","Side","Entry","Exit","Profit","Status"]
                 ).to_csv(LOG_FILE, mode="a", header=False, index=False, encoding="utf-8-sig")

init_log()

# ── 지표 ─────────────────────────────────────────────────────
def get_hma(series, length):
    def wma(s, l):
        w = np.arange(1, l + 1)
        return s.rolling(l).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)
    h, s = int(length / 2), int(np.sqrt(length))
    return wma(2 * wma(series, h) - wma(series, length), s)

# Timeframe settings
TIMEFRAME_CONFIG = {
    "5m":  {"interval": "5m",  "range": "5d",   "workers": 6,  "sleep": 60},
    "30m": {"interval": "30m", "range": "1mo",  "workers": 4,  "sleep": 300},
    "1h":  {"interval": "1h",  "range": "3mo",  "workers": 4,  "sleep": 900},
    "1d":  {"interval": "1d",  "range": "1y",   "workers": 2,  "sleep": 3600},
}

def fetch_data(symbol, interval="5m", range_str="5d", timeout=15):
    r = requests.get(
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval={interval}&range={range_str}&includePrePost=true",
        headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=timeout,
    )
    res = r.json()["chart"]["result"][0]
    p   = res["indicators"]["quote"][0]
    return pd.DataFrame({"Close": p["close"], "High": p["high"], "Low": p["low"]},
                        index=res["timestamp"]).dropna()

def fetch_5m(symbol):
    return fetch_data(symbol, "5m", "5d")

# ── 핵심 처리 ─────────────────────────────────────────────────
def process_ticker(symbol, info, timeframe="5m", is_premium_server=False):
    config = TIMEFRAME_CONFIG.get(timeframe, TIMEFRAME_CONFIG["5m"])
    scan_state[timeframe]["current"] = symbol
    
    try:
        df = fetch_data(symbol, config["interval"], config["range"])
        if df.empty or len(df) < max(CHOP_LEN, HMA_LEN, Z_LEN) + 5:
            return

        close, high, low = df["Close"], df["High"], df["Low"]
        tr  = pd.concat([high-low, (high-close.shift(1)).abs(), (low-close.shift(1)).abs()], axis=1).max(axis=1)
        atr = tr.ewm(alpha=1/ATR_LEN, min_periods=ATR_LEN, adjust=False).mean().iloc[-1]
        rng = high.rolling(CHOP_LEN).max() - low.rolling(CHOP_LEN).min()
        ci  = (100 * np.log10(tr.rolling(CHOP_LEN).sum() / (rng + 1e-9)) / np.log10(CHOP_LEN)).iloc[-1]

        hma_s  = get_hma(close, HMA_LEN)
        hma    = hma_s.iloc[-1]
        z_mean = close.rolling(Z_LEN).mean().iloc[-1]
        z_std  = close.rolling(Z_LEN).std().iloc[-1]
        z      = (close.iloc[-1] - z_mean) / (z_std + 1e-9)

        is_trend = ci < THRESHOLD_TREND
        long_e  = (close.iloc[-2] < hma_s.iloc[-2] and close.iloc[-1] > hma) if is_trend \
                  else (z < -2.1 and (close.iloc[-2] - z_mean) / (z_std + 1e-9) > -2.1)
        short_e = (close.iloc[-2] > hma_s.iloc[-2] and close.iloc[-1] < hma) if is_trend \
                  else (z > 2.1  and (close.iloc[-2] - z_mean) / (z_std + 1e-9) < 2.1)

        if long_e:
            bonus = min(abs(close.iloc[-1]-hma)/(atr+1e-9)*10, 14.0) if is_trend else min(abs(z)*5, 14.0)
            final_score = round(85.0 + bonus, 1)
        elif short_e:
            bonus = min(abs(close.iloc[-1]-hma)/(atr+1e-9)*10, 14.0) if is_trend else min(abs(z)*5, 14.0)
            final_score = round(-(85.0 + bonus), 1)
        else:
            if is_trend:
                mag = min(60.0, abs(close.iloc[-1]-hma) / (atr*2+1e-9) * 60)
                is_bearish = close.iloc[-1] < hma
            else:
                mag = min(60.0, abs(z) / 2.1 * 60)
                is_bearish = z > 0
            final_score = round(-mag if is_bearish else mag, 1)

        curr_p = float(close.iloc[-1])
        signal = "LONG" if long_e else "SHORT" if short_e else "WAIT"

        # 포지션 관리 - 모든 시간대별로 분리
        with data_lock:
            tf_key = timeframe
          # 포지션 관리 - 모든 시간대별로 적용
        with data_lock:
            tf_key = timeframe
            tf_positions = trade_history[tf_key]
            
            # DEBUG: 시그널 상태 로깅
            if long_e or short_e:
                print(f"[DEBUG SIGNAL] {symbol} [{tf_key}]: long_e={long_e}, short_e={short_e}, in_history={symbol in tf_positions}")
            
            if (long_e or short_e) and symbol not in tf_positions:
                side = "LONG" if long_e else "SHORT"
                tf_positions[symbol] = {
                    "entry":      curr_p,
                    "side":       side,
                    "be_active":  False,
                    "sl":  curr_p - (atr*STOP_MULT if side=="LONG" else -atr*STOP_MULT),
                    "tp":  curr_p + (atr*TP_MULT   if side=="LONG" else -atr*TP_MULT),
                    "entry_time": datetime.now().strftime("%H:%M"),
                    "timeframe":  tf_key,
                }
                print(f"[ENTRY] {symbol} [{tf_key}] {side} @ {curr_p:.4f}, SL={tf_positions[symbol]['sl']:.4f}, TP={tf_positions[symbol]['tp']:.4f}")
                log_trade(symbol, side, curr_p, status="ENTRY", is_premium=is_premium_server)
                
                # Supabase에도 저장
                if is_premium_server:
                    save_position_to_supabase(
                        symbol=symbol,
                        name=info.get("name", symbol),
                        timeframe=tf_key,
                        side=side,
                        entry=curr_p,
                        sl=tf_positions[symbol]["sl"],
                        tp=tf_positions[symbol]["tp"]
                    )

            if symbol in tf_positions:
                t = tf_positions[symbol]
                profit = (curr_p - t["entry"]) / t["entry"] * 100 * (1 if t["side"]=="LONG" else -1)
                
                # BE (Breakeven) 활성화
                if profit >= BE_THRESHOLD and not t["be_active"]:
                    t["sl"], t["be_active"] = t["entry"], True
                    log_trade(symbol, t["side"], t["entry"], curr_p, profit, "UPDATE", is_premium=is_premium_server)
                    
                    # Supabase 업데이트
                    if is_premium_server:
                        update_position_in_supabase(symbol, tf_key, {
                            "be_active": True,
                            "sl_price": t["entry"],
                            "current_price": curr_p,
                            "unrealized_pnl": round(profit, 2)
                        })
                
                # SL/TP 체크
                hit_sl = (curr_p <= t["sl"]) if t["side"]=="LONG" else (curr_p >= t["sl"])
                hit_tp = (curr_p >= t["tp"]) if t["side"]=="LONG" else (curr_p <= t["tp"])
                
                if hit_sl or hit_tp:
                    print(f"[EXIT] {symbol} [{tf_key}] @ {curr_p:.4f}, profit={profit:.2f}%")
                    log_trade(symbol, t["side"], t["entry"], curr_p, profit, "EXIT", is_premium=is_premium_server)
                    
                    # Supabase에서 청산
                    if is_premium_server:
                        close_position_in_supabase(
                            symbol=symbol,
                            timeframe=tf_key,
                            exit_price=curr_p,
                            realized_pnl=round(profit, 2),
                            reason="TP" if hit_tp else "SL"
                        )
                    
                    del tf_positions[symbol]

        with data_lock:
            ticker_data[timeframe][symbol] = {
                "name": info["name"], "price": round(curr_p, 4),
                "signal": signal, "score": final_score,
                "ci": round(float(ci), 1), "z": round(float(z), 2),
                "long_t": info["long"], "short_t": info["short"],
                "regime": "TREND" if is_trend else "RANGE",
                "category": info.get("category", "other"),
            }

    except Exception as e:
        print(f"[{symbol}/{timeframe}] 오류: {e}")

# ── 스캔 루프 ─────────────────────────────────────────────────
def scan_loop_5m():
    """5분봉 자동 스캔 - 베이스 티커만"""
    is_premium_server = bool(PREMIUM_API_KEYS)
    while True:
        scan_state["5m"]["running"], scan_state["5m"]["progress"] = True, 0
        tickers = list(LEVERAGE_MAP.items())
        
        # 이전에 실패한 티커 먼저 재시도
        retry_tickers = [(s, LEVERAGE_MAP[s]) for s in failed_tickers.keys() if failed_tickers[s] < 3 and s in LEVERAGE_MAP]
        if retry_tickers:
            print(f"[Retry] {len(retry_tickers)} failed tickers")
            with ThreadPoolExecutor(max_workers=4) as ex:
                for s, i in retry_tickers:
                    ex.submit(process_ticker, s, i, "5m", is_premium_server)
        
        with ThreadPoolExecutor(max_workers=TIMEFRAME_CONFIG["5m"]["workers"]) as ex:
            future_map = {ex.submit(process_ticker, s, i, "5m", is_premium_server): s for s, i in tickers}
            done = 0
            for fut in as_completed(future_map):
                done += 1
                scan_state["5m"]["progress"] = int(done / len(tickers) * 100)
                symbol = future_map[fut]
                try:
                    result = fut.result()
                    # 성공하면 failed_tickers에서 제거
                    if symbol in failed_tickers:
                        del failed_tickers[symbol]
                except Exception as e:
                    print(f"[scan 5m] {symbol}: {e}")
                    # 실패하면 카운트 증가
                    failed_tickers[symbol] = failed_tickers.get(symbol, 0) + 1
        
        scan_state["5m"]["running"], scan_state["5m"]["last_scan"] = False, datetime.now().strftime("%H:%M:%S")
        print(f"[Scan Complete] Total: {len(ticker_data['5m'])}, Failed: {len(failed_tickers)}")
        time.sleep(TIMEFRAME_CONFIG["5m"]["sleep"])

def scan_timeframe(timeframe: str, auth_token: str = None):
    """온디맨드 스캔 - 특정 시간봉"""
    if timeframe not in TIMEFRAME_CONFIG:
        return {"error": "Invalid timeframe"}
    
    is_premium_server = bool(PREMIUM_API_KEYS)
    config = TIMEFRAME_CONFIG[timeframe]
    
    scan_state[timeframe]["running"], scan_state[timeframe]["progress"] = True, 0
    tickers = list(LEVERAGE_MAP.items())
    
    def process_with_progress(item):
        symbol, info = item
        try:
            process_ticker(symbol, info, timeframe, is_premium_server)
        except Exception as e:
            print(f"[{timeframe}] {symbol}: {e}")
        finally:
            with data_lock:
                processing_set.discard(symbol)
    
    with ThreadPoolExecutor(max_workers=config["workers"]) as ex:
        future_map = {ex.submit(process_with_progress, (s, i)): s for s, i in tickers}
        done = 0
        for fut in as_completed(future_map):
            done += 1
            scan_state[timeframe]["progress"] = int(done / len(tickers) * 100)
            try:
                fut.result()
            except Exception as e:
                print(f"[scan {timeframe}] {future_map[fut]}: {e}")
    
    scan_state[timeframe]["running"], scan_state[timeframe]["last_scan"] = False, datetime.now().strftime("%H:%M:%S")
    return {"success": True, "timeframe": timeframe, "count": len(ticker_data.get(timeframe, {}))}

# ── FastAPI ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=scan_loop_5m, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/api/auth")
def get_auth(auth: dict = Depends(verify_token)):
    return JSONResponse({"is_premium": auth["is_premium"], "tier": auth["tier"]})

@app.get("/api/data")
def get_data(tf: str = "5m", auth: dict = Depends(verify_token)):
    if tf not in TIMEFRAME_CONFIG:
        tf = "5m"
    
    with data_lock:
        signals = []
        tf_data = ticker_data.get(tf, {})
        tf_positions = trade_history.get(tf, {})
        for sym, d in tf_data.items():
            entry = {"symbol": sym, **d}
            if auth["is_premium"]:
                entry["position"] = tf_positions.get(sym)
            signals.append(entry)
    signals.sort(key=lambda x: abs(x["score"]), reverse=True)
    resp = {"signals": signals, "scan": scan_state.get(tf, {}), "total": len(signals), "tier": auth["tier"], "timeframe": tf}
    if auth["is_premium"]:
        resp["active"] = sum(1 for s in signals if s.get("position"))
    return JSONResponse(resp)

@app.post("/api/scan")
def trigger_scan(tf: str = "5m", auth: dict = Depends(verify_token)):
    """온디맨드 스캔 트리거"""
    if tf not in TIMEFRAME_CONFIG:
        return JSONResponse({"error": "Invalid timeframe"}, status_code=400)
    
    # 백그라운드에서 스캔 실행
    def run_scan():
        scan_timeframe(tf, auth_token=None)
    
    threading.Thread(target=run_scan, daemon=True).start()
    return JSONResponse({"message": f"{tf} 스캔 시작", "status": "running"})

@app.get("/api/stats")
def get_stats(tf: str = "5m", auth: dict = Depends(verify_token)):
    """시그널 성과표 - 승률, 평균 수익률 등"""
    if not auth["is_premium"]:
        return JSONResponse({"error": "Premium required"}, status_code=403)
    
    if tf not in TIMEFRAME_CONFIG:
        tf = "5m"
    
    # trade_history에서 청산된 포지션들의 성과 계산
    # 실제로는 trading_logs 테이블을 사용하는 것이 더 정확함
    stats = {
        "timeframe": tf,
        "total_signals": 0,
        "win_count": 0,
        "loss_count": 0,
        "win_rate": 0,
        "avg_profit": 0,
        "avg_loss": 0,
        "total_profit": 0,
        "long_signals": 0,
        "short_signals": 0,
        "active_positions": 0,
    }
    
    with data_lock:
        tf_positions = trade_history.get(tf, {})
        stats["active_positions"] = len(tf_positions)
        
        # 현재 포지션들의 미실현 손익 계산
        unrealized_pnl = []
        for symbol, pos in tf_positions.items():
            if symbol in ticker_data.get(tf, {}):
                current_price = ticker_data[tf][symbol].get("price", pos["entry"])
                profit = (current_price - pos["entry"]) / pos["entry"] * 100 * (1 if pos["side"]=="LONG" else -1)
                unrealized_pnl.append(profit)
                if pos["side"] == "LONG":
                    stats["long_signals"] += 1
                else:
                    stats["short_signals"] += 1
        
        if unrealized_pnl:
            stats["avg_unrealized"] = round(sum(unrealized_pnl) / len(unrealized_pnl), 2)
            stats["best_position"] = round(max(unrealized_pnl), 2)
            stats["worst_position"] = round(min(unrealized_pnl), 2)
    
    return JSONResponse(stats)

@app.get("/api/log")
def get_log(auth: dict = Depends(require_premium)):
    try:
        return JSONResponse(pd.read_csv(LOG_FILE, encoding="utf-8-sig").tail(100).iloc[::-1].to_dict(orient="records"))
    except Exception:
        return JSONResponse([])

@app.post("/positions/close-all")
def close_all_positions(auth: dict = Depends(verify_token)):
    """모든 포지션 시장가 청산 (Panic Sell)"""
    # TODO: user_id 추출 로직 필요 (auth에서 user 식별)
    # 현재는 auth["token"]을 user_id로 사용
    user_id = auth.get("token", "unknown")
    if user_id == "unknown":
        raise HTTPException(status_code=400, detail="User identification required")
    
    result = close_all_positions_for_user(user_id)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "청산 실패"))
    
    return JSONResponse(result)

@app.get("/")
def root():
    return {"status": "ok", "service": "cresc-scanner-api"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
