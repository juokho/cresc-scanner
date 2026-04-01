import { useState, useCallback, useEffect, useRef } from "react"
import { supabase } from "../supabase"

const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "http://localhost:8001"

async function getTradingHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token || ""}`
  }
}

export default function useBotStatus() {
  const [botRunning,      setBotRunning]      = useState(false)
  const [connected,       setConnected]       = useState(false)
  const [serverMsg,       setServerMsg]       = useState("")
  const [balance,         setBalance]         = useState("--")
  const [unrealized,      setUnrealized]      = useState("--")
  const [positions,       setPositions]       = useState([])
  const [selectedSymbols, setSelectedSymbols] = useState(["BTCUSDT", "ETHUSDT", "SOLUSDT"])
  const [hasApiKey,       setHasApiKey]       = useState(false)
  const [indicators,      setIndicators]      = useState({})
  
  // 재연결 관련
  const pollRef       = useRef(null)
  const retryCount    = useRef(0)
  const wasConnected  = useRef(false)  // 이전에 연결됐었는지 기억

  const poll = useCallback(async () => {
    try {
      const headers = await getTradingHeaders()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)  // 8초 타임아웃

      const res = await fetch(`${TRADING_API_URL}/status`, { 
        headers, 
        signal: controller.signal 
      })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const status = await res.json()
      
      // 재연결 성공
      if (!wasConnected.current && retryCount.current > 0) {
        console.log(`[useBotStatus] 재연결 성공 (${retryCount.current}번 시도 후)`)
      }
      retryCount.current = 0
      wasConnected.current = true

      setConnected(true)
      setBotRunning(status.bot_running || false)
      setSelectedSymbols(status.selected_symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT"])
      setServerMsg(status.bot_running ? "자동매매 실행 중" : "대기 중")
      setHasApiKey(status.has_api_key || false)

      // 잔고
      const balRes = await fetch(`${TRADING_API_URL}/balance`, { headers })
      if (balRes.ok) {
        const balData = await balRes.json()
        const bal = parseFloat(balData.balance || 0)
        setBalance(bal > 0 ? `$${bal.toFixed(2)}` : "--")
      }

      // 지표 (모니터용)
      const indRes = await fetch(`${TRADING_API_URL}/indicators`, { headers })
      if (indRes.ok) {
        const indData = await indRes.json()
        setIndicators(indData.indicators || {})
      }
      const posRes = await fetch(`${TRADING_API_URL}/positions`, { headers })
      if (posRes.ok) {
        const posData = await posRes.json()
        const active = posData.positions || []
        setPositions(active)
        const totalPnl = active.reduce((acc, p) => acc + (p.pnl || 0), 0)
        setUnrealized(
          active.length === 0 ? "--"
          : totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}`
          : `-$${Math.abs(totalPnl).toFixed(2)}`
        )
      }

    } catch (error) {
      retryCount.current += 1
      
      // Render 슬립에서 깨어나는 중 - 봇 상태는 유지
      if (retryCount.current <= 3) {
        setServerMsg(`재연결 중... (${retryCount.current}/3)`)
      } else {
        setConnected(false)
        setServerMsg("서버 연결 안됨")
        // 봇 상태는 건드리지 않음 - 서버가 다시 살아나면 /status로 실제 상태 확인
      }
      console.error("Poll error:", error.message)
    }
  }, [])

  useEffect(() => {
    poll()
    // 5초마다 폴링 (Render 무료 플랜 슬립 방지 겸)
    pollRef.current = setInterval(poll, 5000)
    return () => clearInterval(pollRef.current)
  }, [poll])

  return {
    botRunning, setBotRunning,
    connected,
    serverMsg, setServerMsg,
    balance,
    unrealized,
    positions,
    selectedSymbols, setSelectedSymbols,
    hasApiKey,
    indicators,
    poll,
  }
}
