import os
from dotenv import load_dotenv

load_dotenv()

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "your-service-key")

# CORS 설정
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://cresc-scanner.onrender.com",
    "https://cresc-scanner.onrender.com/scan",
    "https://cresc-scanner.onrender.com/trade"
]

# 바이낸스 설정
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET_KEY = os.getenv("BINANCE_SECRET_KEY", "")
BINANCE_TESTNET = os.getenv("BINANCE_TESTNET", "true").lower() == "true"

# 환경 설정
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
