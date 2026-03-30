import threading
from collections import defaultdict
from config import DEFAULT_BOT_CONFIG

# ============================================================
# 락 (데드락 방지용 RLock)
# ============================================================
_state_lock   = threading.RLock()
_signals_lock = threading.RLock()
_exec_lock    = threading.RLock()

# ============================================================
# 인메모리 상태 저장소
# ============================================================
user_states:        dict[str, dict] = {}
user_exec_logs:     dict[str, list] = defaultdict(list)
user_signals:       dict[str, list] = defaultdict(list)
user_indicators:    dict[str, dict] = defaultdict(dict)
user_last_bar_ts:   dict[str, dict] = defaultdict(lambda: defaultdict(lambda: 0))
user_position_meta: dict[str, dict[str, dict]] = defaultdict(dict)


def get_user_state(user_id: str) -> dict:
    with _state_lock:
        if user_id not in user_states:
            user_states[user_id] = dict(DEFAULT_BOT_CONFIG)
        return user_states[user_id]


def add_execution_log(
    user_id: str,
    symbol: str,
    side: str,
    status: str,
    reason: str,
    price: float = 0.0,
) -> None:
    import time
    import logging
    log = logging.getLogger("QUANTERQ")

    entry = {
        "time":   time.strftime("%H:%M:%S"),
        "symbol": symbol,
        "side":   side,
        "status": status,
        "reason": reason,
        "price":  round(price, 4),
    }
    with _exec_lock:
        logs = user_exec_logs[user_id]
        logs.insert(0, entry)
        if len(logs) > 50:
            logs.pop()

    icon = "🟢" if status == "SUCCESS" else "🔴"
    log.info(f"{icon} [{status}] {symbol} {side} | {reason} | Price: {price}")
