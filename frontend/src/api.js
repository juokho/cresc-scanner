import { supabase } from "./supabase"

// 1. Render 대시보드 주소와 일치
const SCANNER_API_URL = import.meta.env.VITE_SCANNER_API_URL || "https://cresc-scanner-api.onrender.com"
const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "https://cresc-trading-api.onrender.com"

// [공통] 인증 헤더 생성
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token || ""}`
  }
}

// [1] 인증 및 사용자 정보
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { is_premium: false, tier: "free", user: null }
    
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('api_key,tier')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !apiKeyData) return { is_premium: false, tier: "free", user: session.user }
    
    return {
      is_premium: apiKeyData.tier === "premium",
      tier: apiKeyData.tier || "free",
      user: session.user,
      api_key: apiKeyData.api_key
    }
  } catch (e) {
    return { is_premium: false, tier: "free", user: null }
  }
}

// [2] 스캐너 API
export const fetchSignals = async () => {
  try {
    const res = await fetch(`${SCANNER_API_URL}/api/signals`)
    if (!res.ok) throw new Error("Scanner API Error")
    return await res.json()
  } catch (e) {
    return { signals: [], error: true }
  }
}

export async function triggerScan(timeframe = "5m") {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${SCANNER_API_URL}/api/scan/${timeframe}`, { method: "POST", headers })
    return await res.json()
  } catch (e) {
    return { success: false }
  }
}

// [3] 트레이딩 API
export const fetchTrades = async () => {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${TRADING_API_URL}/api/logs`, { headers })
    return await res.json()
  } catch (e) {
    return { error: true }
  }
}

export const updateBotSettings = async (settings) => {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${TRADING_API_URL}/api/settings`, { method: "POST", headers, body: JSON.stringify(settings) })
    return await res.json()
  } catch (e) {
    return { success: false }
  }
}

export async function toggleBot() {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${TRADING_API_URL}/api/toggle`, { method: "POST", headers })
    return await res.json()
  } catch (e) {
    return { success: false }
  }
}

// [4] 유틸리티 및 호환성 함수 (중요!)
export async function saveApiKey(apiKey) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error("로그인 필요")
    await supabase.from('api_keys').update({ is_active: false }).eq('user_id', session.user.id)
    const { error } = await supabase.from('api_keys').insert({
      user_id: session.user.id, api_key: apiKey, tier: "premium", is_active: true
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function getTier() {
  const auth = await checkAuth()
  return auth.tier
}

// Pricing.jsx 및 기타 파일과의 호환성을 위해 추가
export const setApiKey = saveApiKey; // Pricing.jsx에서 사용하는 이름
export const getApiKey = async () => (await checkAuth()).api_key;