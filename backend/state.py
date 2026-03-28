import asyncio
from typing import Dict, Any
from threading import Lock

# 전역 상태 관리
_state_lock = Lock()
user_states: Dict[str, Dict[str, Any]] = {}
user_exec_logs: Dict[str, list] = {}
user_indicators: Dict[str, Dict[str, Any]] = {}
user_position_meta: Dict[str, Dict[str, Any]] = {}

def get_user_state(user_id: str) -> Dict[str, Any]:
    """사용자 상태 가져오기"""
    with _state_lock:
        if user_id not in user_states:
            user_states[user_id] = {
                "bot_running": False,
                "current_positions": {},
                "last_signal": None,
                "settings": {
                    "leverage": 50,
                    "trade_pct": 0.05,
                    "sl_atr_mult": 1.5,
                    "tp_atr_mult": 3.5
                }
            }
        return user_states[user_id]

def update_user_state(user_id: str, updates: Dict[str, Any]):
    """사용자 상태 업데이트"""
    with _state_lock:
        if user_id in user_states:
            user_states[user_id].update(updates)

def add_exec_log(user_id: str, log_entry: str):
    """실행 로그 추가"""
    with _state_lock:
        if user_id not in user_exec_logs:
            user_exec_logs[user_id] = []
        user_exec_logs[user_id].append({
            "timestamp": asyncio.get_event_loop().time(),
            "message": log_entry
        })
        # 최대 100개 로그 유지
        if len(user_exec_logs[user_id]) > 100:
            user_exec_logs[user_id] = user_exec_logs[user_id][-100:]

def update_indicators(user_id: str, indicators: Dict[str, Any]):
    """지표 업데이트"""
    with _state_lock:
        user_indicators[user_id] = indicators

def update_position_meta(user_id: str, meta: Dict[str, Any]):
    """포지션 메타데이터 업데이트"""
    with _state_lock:
        user_position_meta[user_id] = meta
