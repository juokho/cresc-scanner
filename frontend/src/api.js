// ============================================================
// 현재 FastAPI 백엔드 연동 API
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || ""

// API Key 관리
let apiKey = localStorage.getItem('nexus_api_key') || ''

export function setApiKey(key) {
  apiKey = key
  if (key) {
    localStorage.setItem('nexus_api_key', key)
  } else {
    localStorage.removeItem('nexus_api_key')
  }
}

export function getApiKey() {
  return apiKey
}

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  }
  if (apiKey) {
    headers["X-API-Key"] = apiKey
  }
  return headers
}

// ============================================================
// 인증 및 티어 확인
// ============================================================
export async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/api/auth`, { headers: getHeaders() })
    if (!res.ok) return { is_premium: false, tier: "free" }
    return await res.json()
  } catch {
    return { is_premium: false, tier: "free" }
  }
}

// ============================================================
// 시그널 및 포지션 데이터 조회
// ============================================================
export async function fetchSignals() {
  try {
    const res = await fetch(`${API_URL}/api/data`, { headers: getHeaders() })
    if (!res.ok) return { signals: [], scan: {}, tier: "free" }
    const data = await res.json()
    return {
      signals: data.signals || [],
      scan: data.scan || {},
      total: data.total || 0,
      active: data.active || 0,
      tier: data.tier || "free"
    }
  } catch {
    return { signals: [], scan: {}, tier: "free" }
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
  console.log("Bot start requested:", settings)
  return { success: false, message: "Bot control not available in current backend" }
}

export async function stopBot() {
  console.log("Bot stop requested")
  return { success: false, message: "Bot control not available in current backend" }
}
