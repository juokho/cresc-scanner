import { useState, useCallback, useEffect, useRef } from "react"
import { checkServerStatus, fetchBalance, fetchPositions, fetchSignals } from "../api"

export default function useBotStatus() {
  const [botRunning, setBotRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [serverMsg, setServerMsg] = useState("")
  const [balance, setBalance] = useState("$0.00")
  const [unrealized, setUnrealized] = useState("--")
  const [positions, setPositions] = useState([])
  const [selectedSymbols, setSelectedSymbols] = useState(["BTCUSDT", "ETHUSDT", "SOLUSDT"])
  const pollRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      // 서버 상태 확인
      const status = await checkServerStatus()
      setConnected(status.online)
      
      if (status.online) {
        // 시그널/포지션 데이터 가져오기
        const data = await fetchSignals()
        const positionsWithData = data.signals?.filter(s => s.position) || []
        
        setPositions(positionsWithData.map(s => ({
          symbol: s.symbol,
          side: s.position.side,
          entry: s.position.entry,
          mark: s.price,
          sl: s.position.sl,
          tp: s.position.tp,
          pnl: ((s.price - s.position.entry) / s.position.entry * 100 * (s.position.side === "LONG" ? 1 : -1)),
          roe: ((s.price - s.position.entry) / s.position.entry * 100 * (s.position.side === "LONG" ? 1 : -1))
        })))
        
        // 밸런스는 현재 백엔드에서 미지원 - 더미값
        setBalance("$10,000.00")
        
        // 미실현 PNL 계산
        const totalPnl = positionsWithData.reduce((acc, s) => {
          const pnl = ((s.price - s.position.entry) / s.position.entry * 100 * (s.position.side === "LONG" ? 1 : -1))
          return acc + pnl
        }, 0)
        setUnrealized(totalPnl > 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`)
        
        if (!botRunning && positionsWithData.length > 0) {
          setBotRunning(true)
          setServerMsg("스캐너 실행 중")
        }
      } else {
        setServerMsg("서버 연결 안됨")
      }
    } catch (error) {
      console.error("Poll error:", error)
      setConnected(false)
    }
  }, [botRunning])

  useEffect(() => {
    poll()
    pollRef.current = setInterval(poll, 5000) // 5초마다 폴링
    return () => clearInterval(pollRef.current)
  }, [poll])

  return {
    botRunning,
    setBotRunning,
    connected,
    serverMsg,
    setServerMsg,
    balance,
    unrealized,
    positions,
    selectedSymbols,
    setSelectedSymbols,
    poll
  }
}
