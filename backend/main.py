import asyncio
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from supabase import create_client

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
log = logging.getLogger("CRESCQ")

# ============================================================
# [2] Supabase 클라이언트
# ============================================================
supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================================
# [3] 요청 데이터 모델 (Pydantic)
# ============================================================
class BotStartRequest(BaseModel):
    leverage:         int   = Field(50,   ge=1,   le=125)
    trade_pct:        float = Field(0.05, ge=0.001, le=1.0)
    sl_atr_mult:      float = Field(1.5,  ge=0.1, le=10.0)
    tp_atr_mult:      float = Field(3.5,  ge=0.1, le=20.0)
    sl_mode:          str   = Field("atr")
    selected_symbols: list  = Field(default_factory=lambda: ["BTCUSDT", "ETHUSDT", "SOLUSDT"])

class BotSettingsRequest(BaseModel):
    leverage:         int   = Field(50,   ge=1,   le=125)
    trade_pct:        float = Field(0.05, ge=0.001, le=1.0)
    sl_atr_mult:      float = Field(1.5,  ge=0.1, le=10.0)
    tp_atr_mult:      float = Field(3.5,  ge=0.1, le=20.0)
    sl_mode:          str   = Field("atr")
    selected_symbols: list  = None

class ApiKeyRequest(BaseModel):
    api_key:    str
    secret_key: str

# ============================================================
# [4] 사용자 인증 (Supabase Auth)
# ============================================================
async def get_current_user(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "인증 토큰이 없습니다")
    try:
        res = supabase_client.auth.get_user(authorization.split(" ")[1])
        return res.user.id
    except Exception:
        raise HTTPException(401, "유효하지 않은 토큰입니다")

class SubscriptionInfo(BaseModel):
    plan_type: str = "free"
    status: str = "active"
    features: list = []

# 구독 정보 조회 함수
async def get_user_subscription(user_id: str) -> SubscriptionInfo:
    try:
        res = supabase_client.table("subscriptions").select("*").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            sub = res.data[0]
            plan_type = sub["plan"]
            
            # 만료 확인 (중요!)
            is_expired = False
            if sub.get("expires_at"):
                try:
                    expires_at = datetime.fromisoformat(sub["expires_at"].replace('Z', '+00:00'))
                    is_expired = expires_at < datetime.now(timezone.utc)
                except:
                    # 날짜 파싱 실패 시 만료로 간주
                    is_expired = True
            else:
                # expires_at이 없으면 만료로 간주
                is_expired = True
            
            # 만료되었으면 자동으로 Free 플랜으로 변경
            if is_expired:
                plan_type = "free"
                
            # 플랜별 기능 정의 (Pricing.jsx와 일치)
            features = {
                "free": ["basic_trading", "3_symbols", "manual_control"],
                "basic": ["basic_trading", "5_symbols", "manual_control", "auto_trading_10"],
                "pro": ["advanced_trading", "unlimited_symbols", "auto_settings", "basic_analytics", "discord_alert"],
                "elite": ["pro_trading", "unlimited_symbols", "advanced_analytics", "api_access", "team_features", "leverage_125x"]
            }.get(plan_type, [])
            
            return SubscriptionInfo(
                plan_type=plan_type,
                status="expired" if is_expired else "active",
                features=features
            )
        else:
            # 기본 플랜 (무료)
            return SubscriptionInfo(
                plan_type="free",
                status="active",
                features=["basic_trading", "3_symbols", "manual_control"]
            )
    except Exception as e:
        log.error(f"구독 정보 조회 오류: {e}")
        return SubscriptionInfo(
            plan_type="free",
            status="active",
            features=["basic_trading", "3_symbols", "manual_control"]
        )
# 기능 접근 권한 확인 함수
async def check_feature_access(user_id: str, required_feature: str) -> bool:
    subscription = await get_user_subscription(user_id)
    return required_feature in subscription.features

# ============================================================
# [5] 앱 수명 주기 관리 (백그라운드 루프 시작)
# ============================================================
async def restore_bot_status_from_supabase():
    """서버 시작 시 Supabase에서 봇 상태 복원"""
    try:
        res = supabase_client.table("user_settings").select("user_id,bot_enabled").eq("bot_enabled", True).execute()
        if res.data:
            log.info(f"[restore] {len(res.data)}개 봇 상태 복원 중...")
            for row in res.data:
                user_id = row["user_id"]
                # API 키 확인
                key_res = supabase_client.table("api_keys").select("*").eq("user_id", user_id).execute()
                if key_res.data:
                    try:
                        raw_api = key_res.data[0]["api_key_encrypted"]
                        raw_sec = key_res.data[0]["secret_key_encrypted"]
                        api = decrypt(raw_api)
                        sec = decrypt(raw_sec)
                        if api and sec and init_binance(user_id, api, sec):
                            with _state_lock:
                                state = get_user_state(user_id)
                                state["is_order_enabled"] = True
                            log.info(f"[restore] 봇 복원 완료: {user_id[:8]}...")
                        else:
                            log.warning(f"[restore] Binance 인증 실패: {user_id[:8]}...")
                    except Exception as e:
                        log.error(f"[restore] 봇 복원 오류 {user_id[:8]}...: {e}")
        else:
            log.info("[restore] 복원할 봇 상태 없음")
    except Exception as e:
        log.error(f"[restore] Supabase 조회 실패: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 봇 상태 복원
    await restore_bot_status_from_supabase()
    # 서버 시작 시 트레이딩 엔진 가동
    asyncio.create_task(monitor_loop())
    asyncio.create_task(position_cleanup_loop())
    yield

# ============================================================
# [6] FastAPI 앱 및 CORS 설정
# ============================================================

app = FastAPI(lifespan=lifespan)

# CORS - 환경변수 우선, 없으면 전체 허용
_origins = ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# [7] API 엔드포인트
# ============================================================

@app.get("/ip")
async def get_server_ip():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("https://ifconfig.me/ip", timeout=5)
            return {"server_ip": res.text.strip()}
    except Exception as e:
        return {"error": str(e)}

@app.get("/ping")
async def ping():
    """서버 생존 확인용 (UptimeRobot 등에서 호출)"""
    return {"status": "alive", "service": "trading-api", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/status")
async def get_status(user_id: str = Depends(get_current_user)):
    st = get_user_state(user_id)
    try:
        res = supabase_client.table("api_keys").select("api_key_encrypted").eq("user_id", user_id).execute()
        has_api_key = bool(res.data and res.data[0].get("api_key_encrypted"))
    except Exception:
        has_api_key = False
    return {
        "bot_running":      st["is_order_enabled"],
        "selected_symbols": st["selected_symbols"],
        "leverage":         st["leverage"],
        "trade_pct":        st["trade_pct"],
        "sl_atr_mult":      st["sl_atr_mult"],
        "tp_atr_mult":      st["tp_atr_mult"],
        "sl_mode":          st["sl_mode"],
        "indicators":       user_indicators.get(user_id, {}),
        "execution_logs":   user_exec_logs[user_id],
        "has_api_key":      has_api_key,
    }

@app.post("/bot/start")
async def start_bot(req: BotStartRequest, user_id: str = Depends(get_current_user)):
    res = supabase_client.table("api_keys").select("*").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "API Key가 등록되지 않았습니다")

    raw_api = res.data[0]["api_key_encrypted"]
    raw_sec = res.data[0]["secret_key_encrypted"]
    
    log.info(f"[bot/start] raw_api exists={bool(raw_api)}, raw_sec exists={bool(raw_sec)}")
    
    api = decrypt(raw_api)
    sec = decrypt(raw_sec)
    
    log.info(f"[bot/start] decrypt api len={len(api)}, sec len={len(sec)}")

    if not api or not sec:
        log.error(f"[bot/start] 복호화 실패 - ENCRYPTION_KEY 불일치 가능성")
        raise HTTPException(400, f"API 키 복호화 실패 (api_len={len(api)}, sec_len={len(sec)})")
    
    log.info(f"[bot/start] Binance 인증 시도 - api_key 앞 4자: {api[:4]}***")
    if not init_binance(user_id, api, sec):
        raise HTTPException(400, "Binance 인증에 실패했습니다")

    with _state_lock:
        state = get_user_state(user_id)
        state.update({
            "is_order_enabled": True,
            "leverage":         req.leverage,
            "trade_pct":        req.trade_pct,
            "sl_atr_mult":      req.sl_atr_mult,
            "tp_atr_mult":      req.tp_atr_mult,
            "sl_mode":          req.sl_mode,
            "selected_symbols": req.selected_symbols,
        })
    
    # Supabase에 봇 상태 저장
    try:
        supabase_client.table("user_settings").upsert(
            {"user_id": user_id, "bot_enabled": True, "updated_at": "now()"},
            on_conflict="user_id"
        ).execute()
    except Exception as e:
        log.error(f"[bot/start] Supabase 저장 실패: {e}")
    
    return {"message": "봇이 시작되었습니다", "status": "success"}

@app.post("/bot/stop")
async def stop_bot(user_id: str = Depends(get_current_user)):
    with _state_lock:
        get_user_state(user_id)["is_order_enabled"] = False
    
    # Supabase에 봇 상태 저장
    try:
        supabase_client.table("user_settings").upsert(
            {"user_id": user_id, "bot_enabled": False, "updated_at": "now()"},
            on_conflict="user_id"
        ).execute()
    except Exception as e:
        log.error(f"[bot/stop] Supabase 저장 실패: {e}")
    
    return {"message": "봇이 정지되었습니다"}

@app.get("/positions")
async def get_positions(user_id: str = Depends(get_current_user)):
    state = get_user_state(user_id)
    if not state.get("bn_client"):
        return {"positions": []}
    
    pos = state["bn_client"].futures_position_information()
    active = []
    
    for p in pos:
        amt = float(p.get("positionAmt", 0))
        if amt != 0:
            entry_price = float(p["entryPrice"])
            mark_price = float(p["markPrice"])
            pnl = float(p["unRealizedProfit"])
            # 바이낸스에서 설정된 실제 레버리지값 가져오기
            leverage = float(p.get("leverage", 1))
            
            # 직접 ROE 계산 (롱/숏 구분)
            side = "LONG" if amt > 0 else "SHORT"
            if side == "LONG":
                roe = ((mark_price - entry_price) / entry_price) * leverage * 100
            else:
                roe = ((entry_price - mark_price) / entry_price) * leverage * 100

            active.append({
                "symbol": p["symbol"],
                "side":   side,
                "qty":    abs(amt),
                "entry":  entry_price,
                "mark":   mark_price,
                "pnl":    pnl,
                "roe":    round(roe, 2)  # 소수점 2자리까지 계산해서 전달
            })
    return {"positions": active}

@app.get("/balance")
async def get_balance(user_id: str = Depends(get_current_user)):
    state = get_user_state(user_id)
    if not state.get("bn_client"):
        return {"balance": 0}
    b = state["bn_client"].futures_account_balance()
    usdt = next((i for i in b if i["asset"] == "USDT"), {"balance": 0})
    return {"balance": float(usdt["balance"])}

@app.get("/subscription")
async def get_subscription(user_id: str = Depends(get_current_user)):
    """사용자 구독 정보 조회"""
    return await get_user_subscription(user_id)

@app.get("/subscription/check")
async def check_subscription_access(feature: str, user_id: str = Depends(get_current_user)):
    """기능 접근 권한 확인"""
    has_access = await check_feature_access(user_id, feature)
    sub = await get_user_subscription(user_id)
    return {
        "has_access": has_access,
        "feature": feature,
        "plan_type": sub.plan_type
    }
@app.post("/bot/settings")
async def update_bot_settings(req: BotSettingsRequest, user_id: str = Depends(get_current_user)):
    # 플랜별 설정 제한
    subscription = await get_user_subscription(user_id)
    
    # Free 플랜: 3개 심볼 제한
    if subscription.plan_type == "free" and req.selected_symbols and len(req.selected_symbols) > 3:
        raise HTTPException(403, "Free 플랜은 최대 3개 심볼만 선택 가능합니다")
    
    # Basic 플랜: 5개 심볼 제한
    if subscription.plan_type == "basic" and req.selected_symbols and len(req.selected_symbols) > 5:
        raise HTTPException(403, "Basic 플랜은 최대 5개 심볼만 선택 가능합니다")
    
    # Pro/Elite: 레버리지 제한 확인
    max_leverage = {
        "free": 50,
        "basic": 50,
        "pro": 75,
        "elite": 125
    }.get(subscription.plan_type, 50)
    
    if req.leverage > max_leverage:
        raise HTTPException(403, f"{subscription.plan_type.upper()} 플랜은 최대 {max_leverage}x 레버리지만 가능합니다")
    
    with _state_lock:
        state = get_user_state(user_id)
        state.update({
            "leverage":         req.leverage,
            "trade_pct":        req.trade_pct,
            "sl_atr_mult":      req.sl_atr_mult,
            "tp_atr_mult":      req.tp_atr_mult,
            "sl_mode":          req.sl_mode,
            "selected_symbols": req.selected_symbols or state.get("selected_symbols", ["BTCUSDT", "ETHUSDT", "SOLUSDT"]),
        })
    return {"message": "설정이 업데이트되었습니다", "status": "success"}

@app.get("/user/settings")
async def get_user_settings(user_id: str = Depends(get_current_user)):
    try:
        res = supabase_client.table("user_settings").select("*").eq("user_id", user_id).execute()
        if res.data:
            return res.data[0]
        else:
            # 기본 설정 반환
            return {
                "leverage": 50,
                "trade_pct": 0.05,
                "sl_atr_mult": 1.5,
                "tp_atr_mult": 3.5,
                "sl_mode": "atr",
                "selected_symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
            }
    except Exception as e:
        log.error(f"설정 조회 오류: {e}")
        raise HTTPException(500, "설정 조회 실패")

@app.post("/user/settings")
async def save_user_settings(req: BotSettingsRequest, user_id: str = Depends(get_current_user)):
    try:
        settings_data = {
            "user_id": user_id,
            "leverage": req.leverage,
            "trade_pct": req.trade_pct,
            "sl_atr_mult": req.sl_atr_mult,
            "tp_atr_mult": req.tp_atr_mult,
            "sl_mode": req.sl_mode,
            "selected_symbols": req.selected_symbols or ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
            "updated_at": "now()"
        }
        
        supabase_client.table("user_settings").upsert(
            settings_data,
            on_conflict="user_id"
        ).execute()
        
        # 현재 봇에도 레버리지 적용 (실시간 반영)
        with _state_lock:
            state = get_user_state(user_id)
            if state.get("bn_client"):  # 바이낸스 클라이언트가 있는 경우만
                try:
                    # 선택된 모든 심볼에 레버리지 적용
                    for symbol in (req.selected_symbols or ["BTCUSDT", "ETHUSDT", "SOLUSDT"]):
                        state["bn_client"].futures_change_leverage(symbol=symbol, leverage=req.leverage)
                except Exception as e:
                    log.warning(f"레버리지 설정 실패 {symbol}: {e}")
        
        return {"message": "설정이 저장되었습니다", "status": "success"}
    except Exception as e:
        log.error(f"설정 저장 오류: {e}")
        raise HTTPException(500, "설정 저장 실패")

@app.post("/api-key/save")
async def save_api_key(req: ApiKeyRequest, user_id: str = Depends(get_current_user)):
    enc_api = encrypt(req.api_key)
    enc_sec = encrypt(req.secret_key)
    supabase_client.table("api_keys").upsert(
        {"user_id": user_id, "api_key_encrypted": enc_api, "secret_key_encrypted": enc_sec},
        on_conflict="user_id",
    ).execute()
    return {"message": "API 키가 저장되었습니다"}

if __name__ == "__main__":
    import uvicorn
    port = int(__import__("os").getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)