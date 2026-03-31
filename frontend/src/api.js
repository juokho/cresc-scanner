import { supabase } from "./supabase"

const SCANNER_API_URL = import.meta.env.VITE_SCANNER_API_URL || "https://cresc-scanner-api.onrender.com"
const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "https://cresc-trading-api.onrender.com"

// ============================================================
// 인증
// ============================================================
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { is_premium: false, tier: "free", user: null }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan,is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (error || !data) return { is_premium: false, tier: "free", user: session.user, api_key: null }
    return {
      is_premium: data.plan === "premium",
      tier: data.plan || "free",
      user: session.user,
      api_key: null
    }
  } catch (e) {
    return { is_premium: false, tier: "free", user: null }
  }
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { "Authorization": `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json" }
}

// ============================================================
// 스캐너 API
// ============================================================
export async function fetchSignals(tf = "5m") {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${SCANNER_API_URL}/api/data?tf=${tf}`, { headers })
    if (!res.ok) throw new Error("Scanner API error")
    const data = await res.json()
    return { signals: data.signals || [], scan: data.scan || {}, tier: data.tier || "free", error: false }
  } catch (e) {
    return { signals: [], scan: {}, tier: "free", error: true }
  }
}

export async function triggerScan(timeframe = "5m") {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${SCANNER_API_URL}/api/scan?tf=${timeframe}`, { method: "POST", headers })
    return await res.json()
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ============================================================
// 트레이딩 API
// ============================================================
export const fetchBalance = async () => {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/balance`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export const fetchPositions = async () => {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/positions`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return json.positions || []
  } catch { return [] }
}

// fetchTrades - /execution-logs 엔드포인트 (main.py /status의 execution_logs 활용)
export const fetchTrades = async () => {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/status`, { headers })
    if (!res.ok) return { error: true, trades: [] }
    const json = await res.json()
    // execution_logs를 trades 형식으로 변환
    const logs = json.execution_logs || []
    return { 
      error: false, 
      trades: logs.map(l => ({
        Timestamp: l.time,
        Ticker: l.symbol,
        Side: l.side,
        Entry: l.price,
        Exit: "",
        Profit: "",
        Status: l.status,
        reason: l.reason
      }))
    }
  } catch { return { error: true, trades: [] } }
}

export const updateBotSettings = async (settings) => {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/bot/settings`, {
      method: "POST", headers,
      body: JSON.stringify({
        leverage: settings.leverage,
        trade_pct: settings.tradePct / 100,
        sl_atr_mult: settings.slAtrMult ?? 1.5,
        tp_atr_mult: settings.tpAtrMult ?? 3.5,
        sl_mode: settings.slMode || "atr",
        selected_symbols: settings.selected_symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
      })
    })
    return await res.json()
  } catch (e) { return { success: false, error: e.message } }
}

export async function checkServerStatus() {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/status`, { headers })
    return res.ok
  } catch { return false }
}

// ============================================================
// API 키 관리
// ============================================================
export async function saveApiKey(apiKey, secretKey) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error("로그인이 필요합니다")
    await supabase.from('api_keys').update({ is_active: false }).eq('user_id', session.user.id)
    const { error } = await supabase.from('api_keys').insert({
      user_id: session.user.id,
      api_key: apiKey,
      tier: "premium",
      is_active: true
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function getTier() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return "free"
    const { data, error } = await supabase
      .from('api_keys').select('tier')
      .eq('user_id', session.user.id).eq('is_active', true).maybeSingle()
    if (error || !data) return "free"
    return data.tier || "free"
  } catch { return "free" }
}

export const setApiKey = saveApiKey
export const getApiKey = async () => (await checkAuth()).api_key

export async function fetchUserSubscription() {
  try {
    const headers = await getAuthHeader()
    const res = await fetch(`${TRADING_API_URL}/subscription`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}
