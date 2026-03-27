// ============================================================
// FastAPI 백엔드 연동 API - 빠른 tier 방식
// ============================================================

import { supabase } from "./supabase"

const API_URL = import.meta.env.VITE_API_URL || ""

// 현재 사용자의 tier 정보 (로그인 시 한 번 조회)
let currentTier = localStorage.getItem('cresc_tier') || "free"
let currentApiKey = ""

// ============================================================
// 인증 및 티어 확인 (로그인 시 한 번 호출)
// ============================================================
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      currentTier = "free"
      currentApiKey = ""
      return { is_premium: false, tier: "free", user: null }
    }
    
    // api_keys 테이블에서 tier와 api_key 한 번에 조회
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('api_key,tier')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !apiKeyData) {
      currentTier = "free"
      currentApiKey = ""
      return { is_premium: false, tier: "free", user: session.user }
    }
    
    // 전역 변수에 저장
    currentTier = apiKeyData.tier || "free"
    currentApiKey = apiKeyData.api_key || ""
    
    return {
      is_premium: currentTier === "premium",
      tier: currentTier,
      api_key: currentApiKey,
      user: session.user
    }
  } catch (err) {
    currentTier = "free"
    currentApiKey = ""
    return { is_premium: false, tier: "free", user: null }
  }
}

// ============================================================
// API 요청 헤더 생성 (tier와 api_key 포함)
// ============================================================
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "X-Tier": currentTier,           // tier 정보
    "X-API-Key": currentApiKey || "" // API 키 (없으면 빈 문자열)
  }
  return headers
}

export function getApiKey() {
  return currentApiKey
}

export function getTier() {
  return currentTier
}

export function setTier(tier) {
  currentTier = tier
  localStorage.setItem('cresc_tier', tier)
}

export function setApiKey(key) {
  currentApiKey = key
}

// ============================================================
// 시그널 및 포지션 데이터 조회
// ============================================================
export async function fetchSignals(timeframe = "5m") {
  try {
    const res = await fetch(`${API_URL}/api/data?tf=${timeframe}`, { headers: getHeaders() })
    if (!res.ok) return { signals: [], scan: {}, tier: "free" }
    const data = await res.json()
    return {
      signals: data.signals || [],
      scan: data.scan || {},
      total: data.total || 0,
      active: data.active || 0,
      tier: data.tier || "free",
      timeframe: data.timeframe || timeframe
    }
  } catch {
    return { signals: [], scan: {}, tier: "free" }
  }
}

// ============================================================
// 온디맨드 스캔 트리거
// ============================================================
export async function triggerScan(timeframe = "5m") {
  try {
    const res = await fetch(`${API_URL}/api/scan?tf=${timeframe}`, { 
      method: "POST",
      headers: getHeaders() 
    })
    if (!res.ok) return { success: false }
    return await res.json()
  } catch {
    return { success: false }
  }
}

// ============================================================
// 거래 로그 조회 (유료 전용)
// ============================================================
export async function fetchTrades() {
  try {
    const res = await fetch(`${API_URL}/api/log`, { headers: getHeaders() })
    if (res.status === 403) {
      return { error: "premium_required", data: [] }
    }
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// ============================================================
// 서버 상태 확인
// ============================================================
export async function checkServerStatus() {
  try {
    const res = await fetch(`${API_URL}/api/data`, { headers: getHeaders() })
    return { online: res.ok, status: res.status }
  } catch {
    return { online: false, status: 0 }
  }
}

// ============================================================
// 구독 정보 조회 (현재 백엔드와 호환)
// ============================================================
export async function fetchUserSubscription() {
  return await checkAuth()
}

// ============================================================
// 기능 접근 확인
// ============================================================
export async function checkFeatureAccess(feature) {
  const auth = await checkAuth()
  const isPremium = auth.is_premium
  
  // 무료 기능
  if (feature === "signals" || feature === "view_signals") {
    return { has_access: true, plan_type: auth.tier }
  }
  
  // 유료 기능
  if (feature === "positions" || feature === "history" || feature === "discord") {
    return { has_access: isPremium, plan_type: auth.tier }
  }
  
  return { has_access: isPremium, plan_type: auth.tier }
}

// ============================================================
// 다음은 SaaS 원본과의 호환을 위한 Stub 함수들
// 현재 백엔드에서 미지원하는 기능
// ============================================================

export async function fetchIndicators() {
  // 현재 백엔드에서 /indicators 미지원 - signals에서 파생
  const data = await fetchSignals()
  return data.signals.reduce((acc, s) => {
    acc[s.symbol] = { ci: s.ci, z: s.z, regime: s.regime }
    return acc
  }, {})
}

export async function fetchBalance() {
  // 현재 백엔드에서 /balance 미지원
  return null
}

export async function fetchPositions() {
  // /api/data에서 포지션 정보 추출
  const data = await fetchSignals()
  return data.signals.filter(s => s.position).map(s => ({
    symbol: s.symbol,
    side: s.position.side,
    entry: s.position.entry,
    sl: s.position.sl,
    tp: s.position.tp,
    be_active: s.position.be_active,
    current_price: s.price,
    name: s.name
  }))
}

export async function fetchUserSettings() {
  // 현재 백엔드에서 /user/settings 미지원 - 로컬 스토리지 사용
  return {
    leverage: parseInt(localStorage.getItem('settings_leverage')) || 50,
    trade_pct: parseFloat(localStorage.getItem('settings_trade_pct')) || 0.05,
    sl_atr_mult: parseFloat(localStorage.getItem('settings_sl_atr_mult')) || 1.5,
    tp_atr_mult: parseFloat(localStorage.getItem('settings_tp_atr_mult')) || 3.5,
  }
}

export async function saveUserSettings(settings) {
  // 현재 백엔드에서 저장 미지원 - 로컬 스토리지 사용
  localStorage.setItem('settings_leverage', settings.leverage)
  localStorage.setItem('settings_trade_pct', settings.tradePct / 100)
  localStorage.setItem('settings_sl_atr_mult', settings.slAtrMult)
  localStorage.setItem('settings_tp_atr_mult', settings.tpAtrMult)
  return { success: true }
}

export async function updateBotSettings(settings) {
  return await saveUserSettings(settings)
}

export async function startBot(settings) {
  // 현재 백엔드에서 봇 제어 미지원
  return { success: false, message: "Bot control not available in current backend" }
}

export async function stopBot() {
  return { success: false, message: "Bot control not available in current backend" }
}
