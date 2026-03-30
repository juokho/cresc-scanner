import { supabase } from "./supabase"

// [설정] 환경변수 우선, 없으면 Render 기본 주소 사용
const SCANNER_API_URL = import.meta.env.VITE_SCANNER_API_URL || "https://quanter-scanner-api.onrender.com"
const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "https://quanter-trading-api.onrender.com"

// ============================================================
// [1] 인증 및 사용자 정보 (원본 로직 100% 복구)
// ============================================================
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { is_premium: false, tier: "free", user: null }
    }
    
    // api_keys 테이블에서 현재 활성화된 키와 티어 조회
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('api_key, tier')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle() // 단일 행 보장
    
    if (error || !apiKeyData) {
      return { 
        is_premium: false, 
        tier: "free", 
        user: session.user,
        api_key: null 
      }
    }
    
    return {
      is_premium: apiKeyData.tier === "premium",
      tier: apiKeyData.tier || "free",
      user: session.user,
      api_key: apiKeyData.api_key
    }
  } catch (e) {
    console.error("Auth Check Error:", e)
    return { is_premium: false, tier: "free", user: null }
  }
}

// ============================================================
// [2] 스캐너 API (cresc-scanner-api)
// ============================================================
export const fetchSignals = async () => {
  try {
    const res = await fetch(`${SCANNER_API_URL}/api/signals`)
    if (!res.ok) throw new Error("Scanner API response was not ok")
    const data = await res.json()
    return { signals: data.signals || [], error: false }
  } catch (e) {
    console.error("Fetch Signals Error:", e)
    return { signals: [], error: true }
  }
}

export async function triggerScan(timeframe = "5m") {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${SCANNER_API_URL}/api/scan/${timeframe}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json"
      }
    })
    return await res.json()
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ============================================================
// [3] 트레이딩 API (cresc-trading-api)
// ============================================================
export const fetchTrades = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${TRADING_API_URL}/api/logs`, {
      headers: { "Authorization": `Bearer ${session?.access_token || ""}` }
    })
    if (!res.ok) throw new Error("Trading API Error")
    return await res.json()
  } catch (e) {
    return { error: true, message: e.message }
  }
}

export const fetchBalance = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${TRADING_API_URL}/balance`, {
      headers: { "Authorization": `Bearer ${session?.access_token || ""}` }
    })
    if (!res.ok) throw new Error("Balance fetch error")
    return await res.json()
  } catch (e) {
    return { balance: 0, error: e.message }
  }
}

export const updateBotSettings = async (settings) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${TRADING_API_URL}/api/settings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settings)
    })
    return await res.json()
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// **추가: Settings.jsx 빌드 에러 해결용 함수**
export async function checkServerStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${TRADING_API_URL}/api/logs`, {
      headers: { "Authorization": `Bearer ${session?.access_token || ""}` }
    })
    return res.ok
  } catch (e) {
    return false
  }
}

// ============================================================
// [4] API 키 관리 및 티어 (Pricing, Settings 대응)
// ============================================================
export async function saveApiKey(apiKey, secretKey) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error("로그인이 필요합니다")
    
    // 1. 기존 활성 키 비활성화
    await supabase.from('api_keys').update({ is_active: false }).eq('user_id', session.user.id)
    
    // 2. 새 키 등록 (기본 프리미엄 티어로 설정)
    const { error } = await supabase.from('api_keys').insert({
      user_id: session.user.id,
      api_key: apiKey,
      secret_key: secretKey,
      tier: "premium",
      is_active: true
    })
    
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Save API Key Error:", error)
    throw error
  }
}

export async function getTier() {
  const auth = await checkAuth()
  return auth.tier
}

// 호환성 별칭 (원본 코드들의 호출명 유지)
export const setApiKey = saveApiKey
export const getApiKey = async () => (await checkAuth()).api_key