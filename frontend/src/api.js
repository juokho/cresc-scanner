import { supabase } from "./supabase"

// Scanner API (port 8000)
const SCANNER_API_URL = import.meta.env.VITE_SCANNER_API_URL || "https://cresc-scanner-api.onrender.com"
// Trading API (port 8001)  
const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "https://cresc-trading-api.onrender.com"

// ============================================================
// 인증 확인 (for Home.jsx compatibility)
// ============================================================
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { is_premium: false, tier: "free", user: null }
    }
    
    // api_keys 테이블에서 tier와 api_key 조회
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('api_key,tier')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !apiKeyData) {
      return { is_premium: false, tier: "free", user: session.user }
    }
    
    return {
      is_premium: apiKeyData.tier === "premium",
      tier: apiKeyData.tier || "free",
      api_key: apiKeyData.api_key || "",
      user: session.user
    }
  } catch (err) {
    return { is_premium: false, tier: "free", user: null }
  }
}

async function getHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ""
    
    if (!token) {
      throw new Error("로그인이 필요합니다")
    }
    
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    }
  } catch (error) {
    console.error("인증 토큰 가져오기 실패:", error)
    throw new Error("인증 오류가 발생했습니다. 다시 로그인해주세요.")
  }
}

// ============================================================
// 서버 상태 (Scanner)
// ============================================================
export async function checkServerStatus() {
  const headers = await getHeaders()
  const res = await fetch(`${SCANNER_API_URL}/status`, { headers })
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
  return await res.json()
}

// ============================================================
// 지표 조회 (Scanner)
// ============================================================
export async function fetchIndicators() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${SCANNER_API_URL}/indicators`, { headers })
    if (!res.ok) return {}
    const json = await res.json()
    return json.indicators || {}
  } catch {
    return {}
  }
}

// ============================================================
// 시그널 로그 조회 (Scanner)
// ============================================================
export async function fetchSignals() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${SCANNER_API_URL}/signals`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return json.signals || []
  } catch {
    return []
  }
}

// ============================================================
// 봇 설정 업데이트 (Trading)
// ============================================================
export async function updateBotSettings(settings) {
  const headers = await getHeaders()
  const res = await fetch(`${TRADING_API_URL}/bot/settings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      leverage:         settings.leverage,
      trade_pct:        settings.tradePct / 100,
      sl_atr_mult:      settings.slAtrMult ?? 1.5,
      tp_atr_mult:      settings.tpAtrMult ?? 3.5,
      sl_mode:          settings.slMode || "atr",
      selected_symbols: settings.selected_symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    }),
  })
  if (!res.ok) {
    let detail = "설정 업데이트 실패"
    try { const err = await res.json(); detail = err.detail || JSON.stringify(err) } catch {}
    throw new Error(`[${res.status}] ${detail}`)
  }
  return await res.json()
}

// ============================================================
// 봇 시작 (Trading)
// ============================================================
export async function startBot({ leverage, trade_pct, sl_atr_mult, tp_atr_mult, sl_mode }) {
  const headers = await getHeaders()
  const res = await fetch(`${TRADING_API_URL}/bot/start`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      leverage:    leverage    ?? 50,
      trade_pct:   trade_pct  ?? 0.05,
      sl_atr_mult: sl_atr_mult ?? 1.5,
      tp_atr_mult: tp_atr_mult ?? 3.5,
      sl_mode:     sl_mode    ?? "atr",
    }),
  })
  if (!res.ok) {
    let detail = "봇 시작 실패"
    try { const err = await res.json(); detail = err.detail || JSON.stringify(err) } catch {}
    throw new Error(`[${res.status}] ${detail}`)
  }
  return await res.json()
}

// ============================================================
// 봇 정지 (Trading)
// ============================================================
export async function stopBot() {
  const headers = await getHeaders()
  const res = await fetch(`${TRADING_API_URL}/bot/stop`, {
    method: "POST",
    headers,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || "봇 정지 실패")
  }
  return await res.json()
}

// ============================================================
// 잔고 조회 (Trading)
// ============================================================
export async function fetchBalance() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/balance`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ============================================================
// 포지션 조회 (Trading)
// ============================================================
export async function fetchPositions() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/positions`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return json.positions || []
  } catch {
    return []
  }
}

// ============================================================
// 사용자 설정 조회 (Trading)
// ============================================================
export async function fetchUserSettings() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/user/settings`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ============================================================
// 사용자 설정 저장 (Trading)
// ============================================================
export async function saveUserSettings(settings) {
  const headers = await getHeaders()
  const res = await fetch(`${TRADING_API_URL}/user/settings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      leverage:         settings.leverage,
      trade_pct:        settings.tradePct / 100,
      sl_atr_mult:      settings.slAtrMult ?? 1.5,
      tp_atr_mult:      settings.tpAtrMult ?? 3.5,
      sl_mode:          settings.slMode || "atr",
      selected_symbols: settings.selected_symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    }),
  })
  if (!res.ok) {
    let detail = "설정 저장 실패"
    try { const err = await res.json(); detail = err.detail || JSON.stringify(err) } catch {}
    throw new Error(`[${res.status}] ${detail}`)
  }
  return await res.json()
}

// ============================================================
// 바이낸스 API 키 저장 (Trading)
// ============================================================
export async function saveApiKey(apiKey, secretKey) {
  const headers = await getHeaders()
  const res = await fetch(`${TRADING_API_URL}/api-key/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      api_key: apiKey,
      secret_key: secretKey,
    }),
  })
  if (!res.ok) {
    let detail = "API 키 저장 실패"
    try { const err = await res.json(); detail = err.detail || JSON.stringify(err) } catch {}
    throw new Error(`[${res.status}] ${detail}`)
  }
  return await res.json()
}

export async function fetchUserSubscription() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/subscription`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("구독 정보 조회 실패:", error)
    return null
  }
}

export async function checkFeatureAccess(feature) {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/subscription/check`, {
      method: "POST",
      headers,
      body: JSON.stringify({ feature })
    })
    if (!res.ok) return { has_access: false, plan_type: "free" }
    return await res.json()
  } catch (error) {
    console.error("기능 접근 확인 실패:", error)
    return { has_access: false, plan_type: "free" }
  }
}

// ============================================================
// 거래 내역 조회 (Trading)
// ============================================================
export async function fetchTrades() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${TRADING_API_URL}/trades`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return json.trades || []
  } catch {
    return []
  }
}

// ============================================================
// Scanner API (for Home.jsx compatibility)
// ============================================================
export async function getApiKey() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !data) return null
    return data.api_key
  } catch {
    return null
  }
}

export async function setApiKey(apiKey) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error("로그인이 필요합니다")
    
    // 기존 API Key 비활성화
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', session.user.id)
    
    // 새 API Key 저장
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: session.user.id,
        api_key: apiKey,
        tier: "premium",
        is_active: true
      })
    
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("API Key 저장 오류:", error)
    throw error
  }
}

export async function getTier() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return "free"
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('tier')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !data) return "free"
    return data.tier || "free"
  } catch {
    return "free"
  }
}

export async function triggerScan() {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${SCANNER_API_URL}/scan`, { 
      method: 'POST',
      headers 
    })
    if (!res.ok) throw new Error(`Scan failed: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error("Trigger scan error:", error)
    throw error
  }
}
