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
  const [hasApiKey,       setHasApiKey]       = useState(false)  // Binance API 키 등록 여부
  const pollRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const headers = await getTradingHeaders()

      // 1. 서버 상태 + 봇 실행 여부
      const res = await fetch(`${TRADING_API_URL}/status`, { headers })
      if (!res.ok) {
        setConnected(false)
        setServerMsg("서버 연결 안됨")
        return
      }
      const status = await res.json()
      setConnected(true)
      setBotRunning(status.bot_running || false)
      setSelectedSymbols(status.selected_symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT"])
      setServerMsg(status.bot_running ? "자동매매 실행 중" : "대기 중")
      setHasApiKey(status.has_api_key || false)

      // 3. 잔고
      const balRes = await fetch(`${TRADING_API_URL}/balance`, { headers })
      if (balRes.ok) {
        const balData = await balRes.json()
        const bal = parseFloat(balData.balance || 0)
        setBalance(bal > 0 ? `$${bal.toFixed(2)}` : "--")
      }

      // 4. 포지션
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
      console.error("Poll error:", error)
      setConnected(false)
      setServerMsg("서버 연결 안됨")
    }
  }, [])

  useEffect(() => {
    poll()
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
    poll,
  }
}
