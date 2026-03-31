import logging
import time
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import urllib3
from binance.client import Client

from config import (
    ALL_TARGET_SYMBOLS, BAR_SIZE, MAX_WORKERS, MIN_NOTIONAL,
    CHOP_LEN, THRESHOLD_TREND, HMA_LEN, Z_LEN, ATR_LEN,
)
from state import (
    _state_lock, get_user_state,
    user_states,  # <--- 이 부분이 추가되어 루프 에러를 방지합니다
    user_last_bar_ts, user_indicators, user_position_meta,
    add_execution_log,
)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
log = logging.getLogger("CRESCQ")

# ============================================================
# 유틸리티
# ============================================================
def format_by_step(value, step_size) -> str:
    d = Decimal(str(step_size))
    r = (Decimal(str(value)) // d) * d
    p = abs(d.as_tuple().exponent) if "." in str(step_size) else 0
    return format(float(r), f".{p}f")

def calculate_hma(series: pd.Series, length: int) -> pd.Series:
    h, s = int(length / 2), int(np.sqrt(length))
    def wma(x, l):
        w = np.arange(1, l + 1)
        return x.rolling(l).apply(lambda a: np.dot(a, w) / w.sum(), raw=True)
    return wma(2 * wma(series, h) - wma(series, length), s)

# ============================================================
# 바이낸스 클라이언트 초기화
# ============================================================
def init_binance(user_id: str, api_key: str, secret_key: str) -> bool:
    state = get_user_state(user_id)
    try:
        client = Client(api_key, secret_key, requests_params={"timeout": 20})
        st = client.get_server_time()
        client.timestamp_offset = st["serverTime"] - int(time.time() * 1000)
        info = client.futures_exchange_info()
        bn_symbols = {
            s["symbol"]: s
            for s in info["symbols"]
            if s["symbol"] in ALL_TARGET_SYMBOLS
        }
        with _state_lock:
            state["bn_client"]  = client
            state["bn_symbols"] = bn_symbols
        return True
    except Exception as e:
        log.error(f"Binance 인증 실패: {type(e).__name__}: {e}")
        return False

# ============================================================
# 심볼 분석 (지표 계산 + 진입 시그널)
# ============================================================
def check_symbol_nexus(user_id: str, symbol: str) -> None:
    try:
        state     = get_user_state(user_id)
        bn_client = state.get("bn_client")
        if not bn_client:
            return

        klines = bn_client.futures_klines(symbol=symbol, interval=BAR_SIZE, limit=100)
        df = pd.DataFrame(
            klines,
            columns=["ts", "open", "high", "low", "close", "vol",
                     "cts", "qv", "t", "tb", "tq", "i"],
        )
        df[["open", "high", "low", "close", "vol"]] = (
            df[["open", "high", "low", "close", "vol"]].apply(pd.to_numeric)
        )

        closed_ts = int(df.iloc[-2]["ts"])
        if user_last_bar_ts[user_id][symbol] == closed_ts:
            return
        user_last_bar_ts[user_id][symbol] = closed_ts
        df = df.iloc[:-1].copy()

        # 지표 계산
        hl = df["high"] - df["low"]
        hc = (df["high"] - df["close"].shift(1)).abs()
        lc = (df["low"]  - df["close"].shift(1)).abs()
        df["tr"]  = pd.concat([hl, hc, lc], axis=1).max(axis=1)
        df["atr"] = df["tr"].ewm(alpha=1 / ATR_LEN, adjust=False).mean()

        hh = df["high"].rolling(CHOP_LEN).max()
        ll = df["low"].rolling(CHOP_LEN).min()
        df["ci"]      = 100 * np.log10(df["tr"].rolling(CHOP_LEN).sum() / (hh - ll)) / np.log10(CHOP_LEN)
        df["hma"]     = calculate_hma(df["close"], HMA_LEN)
        df["z_score"] = (df["close"] - df["close"].rolling(Z_LEN).mean()) / df["close"].rolling(Z_LEN).std()

        curr, prev   = df.iloc[-1], df.iloc[-2]
        is_trending  = curr["ci"] < THRESHOLD_TREND

        user_indicators[user_id][symbol] = {
            "regime":  "TREND" if is_trending else "RANGE",
            "ci":      round(float(curr["ci"]),      2),
            "close":   round(float(curr["close"]),   4),
            "atr":     round(float(curr["atr"]),     4),
            "z_score": round(float(curr["z_score"]), 4),
            "hma":     round(float(curr["hma"]),     4),
        }

        # 진입 조건
        side, logic = None, ""
        if is_trending:
            if prev["close"] <= prev["hma"] and curr["close"] > curr["hma"]:
                side, logic = "LONG",  "TREND_HMA"
            elif prev["close"] >= prev["hma"] and curr["close"] < curr["hma"]:
                side, logic = "SHORT", "TREND_HMA"
        else:
            if prev["z_score"] <= -2.0 and curr["z_score"] > -2.0:
                side, logic = "LONG",  "RANGE_Z"
            elif prev["z_score"] >= 2.0 and curr["z_score"] < 2.0:
                side, logic = "SHORT", "RANGE_Z"

        if side:
            execute_binance_order(
                user_id, symbol, side,
                float(curr["close"]), float(curr["atr"]), logic,
            )

    except Exception as e:
        log.error(f"{symbol} 분석 오류: {e}", exc_info=True)

# ============================================================
# 주문 실행
# ============================================================
def execute_binance_order(
    user_id: str,
    symbol: str,
    side: str,
    price: float,
    atr_val: float,
    logic: str,
) -> None:
    state = get_user_state(user_id)
    if not state["is_order_enabled"]:
        return

    try:
        bn_client = state["bn_client"]

        # 포지션 중복 진입 방지
        pos = bn_client.futures_position_information(symbol=symbol)
        if any(float(p.get("positionAmt", 0)) != 0 for p in pos):
            return

        leverage = state["leverage"]
        filters  = state["bn_symbols"][symbol]["filters"]
        step     = next(f["stepSize"] for f in filters if f["filterType"] == "LOT_SIZE")

        bn_client.futures_change_leverage(symbol=symbol, leverage=leverage)
        acc = bn_client.futures_account(recvWindow=40000)

        qty = format_by_step(
            (float(acc["availableBalance"]) * state["trade_pct"] * leverage) / price,
            step,
        )
        if float(qty) * price < MIN_NOTIONAL:
            add_execution_log(user_id, symbol, side, "IGNORED", "Size too small", price)
            return

        order_side = "BUY" if side == "LONG" else "SELL"
        bn_client.futures_create_order(
            symbol=symbol, side=order_side, type="MARKET", quantity=qty
        )
        user_position_meta[user_id][symbol] = {
            "entry": price, "atr": atr_val, "side": side, "hwm": price
        }
        add_execution_log(user_id, symbol, side, "SUCCESS", f"Entry: {logic}", price)

    except Exception as e:
        add_execution_log(user_id, symbol, side, "ERROR", str(e), price)
        log.error(f"주문 실행 오류 {symbol}: {e}", exc_info=True)

# ============================================================
# 백그라운드 루프
# ============================================================
async def monitor_loop() -> None:
    import asyncio
    while True:
        try:
            active_users = [
                uid for uid, st in user_states.items()
                if st.get("is_order_enabled")
            ]
            for user_id in active_users:
                state   = get_user_state(user_id)
                targets = state.get("selected_symbols", ALL_TARGET_SYMBOLS)
                loop = asyncio.get_event_loop()
                await asyncio.gather(*(
                    loop.run_in_executor(None, check_symbol_nexus, user_id, sym)
                    for sym in targets
                ))
        except Exception as e:
            log.error(f"monitor_loop 오류: {e}", exc_info=True)
        await asyncio.sleep(2)

async def position_cleanup_loop() -> None:
    import asyncio
    while True:
        try:
            active_users = [
                uid for uid, st in user_states.items()
                if st.get("is_order_enabled")
            ]
            for user_id in active_users:
                state     = get_user_state(user_id)
                bn_client = state.get("bn_client")
                if not bn_client:
                    continue

                pos_info = bn_client.futures_position_information()
                for p in pos_info:
                    amt    = float(p.get("positionAmt", 0))
                    symbol = p["symbol"]

                    if amt == 0:
                        user_position_meta[user_id].pop(symbol, None)
                        continue

                    meta = user_position_meta[user_id].get(symbol)
                    if not meta:
                        continue

                    mark     = float(p.get("markPrice", 0))
                    entry    = meta["entry"]
                    atr      = meta["atr"]
                    side     = meta["side"]
                    sl_mult  = state["sl_atr_mult"]
                    tp_mult  = state["tp_atr_mult"]

                    should_close, reason = False, ""
                    if state["sl_mode"] == "atr":
                        if side == "LONG":
                            if mark <= entry - atr * sl_mult:
                                should_close, reason = True, "SL Hit"
                            elif mark >= entry + atr * tp_mult:
                                should_close, reason = True, "TP Hit"
                        else:
                            if mark >= entry + atr * sl_mult:
                                should_close, reason = True, "SL Hit"
                            elif mark <= entry - atr * tp_mult:
                                should_close, reason = True, "TP Hit"

                    if should_close:
                        close_side = "SELL" if amt > 0 else "BUY"
                        bn_client.futures_create_order(
                            symbol=symbol, side=close_side,
                            type="MARKET", quantity=abs(amt), reduceOnly=True,
                        )
                        add_execution_log(user_id, symbol, "EXIT", "SUCCESS", reason, mark)

        except Exception as e:
            log.error(f"position_cleanup_loop 오류: {e}", exc_info=True)
        await asyncio.sleep(1)