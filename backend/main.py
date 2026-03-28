import asyncio
import logging
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGINS
from crypto_utils import encrypt, decrypt
from state import (
    _state_lock, get_user_state,
    user_exec_logs, user_indicators, user_position_meta,
)
from trading import init_binance, monitor_loop, position_cleanup_loop

# ============================================================
# [1] 로깅 설정
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("nexus_bot.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("QUANTER")

# ============================================================
# [2] Supabase 클라이언트
# ============================================================
try:
    from supabase import create_client
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except ImportError:
    log.warning("Supabase not installed, using mock client")
    supabase_client = None

# ============================================================
# [3] 요청 데이터 모델 (Pydantic)
# ============================================================
class BotStartRequest(BaseModel):
    leverage: int = Field(50, ge=1, le=125)
    trade_pct: float = Field(0.05, ge=0.001, le=1.0)
    sl_atr_mult: float = Field(1.5, ge=0.1, le=10.0)
    tp_atr_mult: float = Field(3.5, ge=0.1, le=20.0)
    sl_mode: str = Field("atr")
    selected_symbols: list = Field(default_factory=lambda: ["BTCUSDT", "ETHUSDT", "SOLUSDT"])

class BotSettingsRequest(BaseModel):
    leverage: int = Field(50, ge=1, le=125)
    trade_pct: float = Field(0.05, ge=0.001, le=1.0)
    sl_atr_mult: float = Field(1.5, ge=0.1, le=10.0)
    tp_atr_mult: float = Field(3.5, ge=0.1, le=20.0)

class ApiKeyRequest(BaseModel):
    api_key: str
    secret_key: str

# ============================================================
# [4] 애플리케이션 라이프사이클
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 실행
    log.info("QUANTER Trading Bot starting...")
    yield
    # 종료 시 실행
    log.info("QUANTER Trading Bot shutting down...")

# ============================================================
# [5] FastAPI 앱 생성
# ============================================================
app = FastAPI(
    title="QUANTER Trading Bot API",
    description="AI 기반 코인 선물 자동매매 봇",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================
# [6] CORS 미들웨어
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# [7] 인증 헬퍼 함수
# ============================================================
async def get_current_user(authorization: str = Header(None)):
    """현재 사용자 인증"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    try:
        if supabase_client:
            # Supabase로 토큰 검증
            user = supabase_client.auth.get_user(token)
            return user
        else:
            # 개발용 모의 사용자
            return {"id": "dev_user", "email": "dev@example.com"}
    except Exception as e:
        log.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================================
# [8] API 엔드포인트
# ============================================================

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "QUANTER Trading Bot API", "status": "running"}

@app.get("/status")
async def get_status():
    """서버 상태 확인"""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}

@app.post("/trading/start")
async def start_bot(request: BotStartRequest, user = Depends(get_current_user)):
    """봇 시작"""
    user_id = user["id"]
    
    try:
        # 사용자 상태 업데이트
        user_state = get_user_state(user_id)
        user_state["bot_running"] = True
        user_state["settings"] = request.dict()
        
        # 봇 시작 로직
        log.info(f"Starting bot for user {user_id}")
        
        # TODO: 실제 봇 시작 로직 구현
        
        return {"success": True, "message": "Bot started successfully"}
    
    except Exception as e:
        log.error(f"Failed to start bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trading/stop")
async def stop_bot(user = Depends(get_current_user)):
    """봇 중지"""
    user_id = user["id"]
    
    try:
        # 사용자 상태 업데이트
        user_state = get_user_state(user_id)
        user_state["bot_running"] = False
        
        # 봇 중지 로직
        log.info(f"Stopping bot for user {user_id}")
        
        # TODO: 실제 봇 중지 로직 구현
        
        return {"success": True, "message": "Bot stopped successfully"}
    
    except Exception as e:
        log.error(f"Failed to stop bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading/status")
async def get_bot_status(user = Depends(get_current_user)):
    """봇 상태 조회"""
    user_id = user["id"]
    user_state = get_user_state(user_id)
    
    return {
        "bot_running": user_state["bot_running"],
        "settings": user_state["settings"],
        "positions": user_state.get("current_positions", {})
    }

@app.post("/trading/settings")
async def update_settings(request: BotSettingsRequest, user = Depends(get_current_user)):
    """봇 설정 업데이트"""
    user_id = user["id"]
    
    try:
        user_state = get_user_state(user_id)
        user_state["settings"].update(request.dict())
        
        return {"success": True, "message": "Settings updated"}
    
    except Exception as e:
        log.error(f"Failed to update settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trading/api-key")
async def set_api_key(request: ApiKeyRequest, user = Depends(get_current_user)):
    """API Key 설정"""
    user_id = user["id"]
    
    try:
        # API Key 암호화 저장
        encrypted_key = encrypt(request.api_key)
        encrypted_secret = encrypt(request.secret_key)
        
        # TODO: 데이터베이스에 저장
        
        # 바이낸스 연결 테스트
        success = await init_binance(request.api_key, request.secret_key)
        
        if success:
            return {"success": True, "message": "API Key set successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid API Key")
    
    except Exception as e:
        log.error(f"Failed to set API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading/positions")
async def get_positions(user = Depends(get_current_user)):
    """현재 포지션 조회"""
    user_id = user["id"]
    
    try:
        # TODO: 실제 포지션 조회 로직
        user_state = get_user_state(user_id)
        return {"positions": user_state.get("current_positions", {})}
    
    except Exception as e:
        log.error(f"Failed to get positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
