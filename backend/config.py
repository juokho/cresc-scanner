import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# 전역 상수 설정
# ============================================================
ALL_TARGET_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
BAR_SIZE           = "5m"
MAX_WORKERS        = 3
MIN_NOTIONAL       = 5.2
CHOP_LEN           = 14
THRESHOLD_TREND    = 40.0
HMA_LEN            = 21
Z_LEN              = 20
ATR_LEN            = 14

DEFAULT_BOT_CONFIG = {
    "is_order_enabled":  False,
    "leverage":          50,
    "trade_pct":         0.05,
    "sl_atr_mult":       1.5,
    "tp_atr_mult":       3.5,
    "sl_mode":           "atr",
    "selected_symbols":  ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    "bn_client":         None,
    "bn_symbols":        {},
}

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ENCRYPTION_KEY       = os.getenv("ENCRYPTION_KEY", "default_secret_key")

# CORS: .env의 ALLOWED_ORIGINS 를 실제로 파싱해서 사용
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
