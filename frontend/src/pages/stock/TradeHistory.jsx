import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { StockNavBar } from "../../components/NavBar"
import { fetchTrades } from "../../api"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../../theme'

function LogoIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

export default function TradeHistory() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const data = await fetchTrades()
        if (!data.error) {
          setTrades(data.trades || [])
        }
      } catch (e) {
        console.error("거래 내역 로드 실패:", e)
      } finally {
        setLoading(false)
      }
    }
    loadTrades()
  }, [])

  // 필터링
  const filteredTrades = trades.filter(t => {
    if (filter === "all") return true
    if (filter === "long") return t.Side === "LONG"
    if (filter === "short") return t.Side === "SHORT"
    if (filter === "entry") return t.Status === "ENTRY"
    if (filter === "exit") return t.Status === "EXIT"
    return true
  })

  // 통계
  const totalTrades = trades.length
  const longTrades = trades.filter(t => t.Side === "LONG").length
  const shortTrades = trades.filter(t => t.Side === "SHORT").length
  const winTrades = trades.filter(t => t.Profit?.startsWith("+")).length

  return (
    <div style={{ 
      background: BG, 
      minHeight: "100vh", 
      fontFamily: "'DM Sans', sans-serif", 
      color: TEXT_PRI,
      maxWidth: 430,
      margin: "0 auto",
      paddingBottom: 100
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8,
        padding: "14px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        <LogoIcon size={26}/>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>
          <span style={{ color: BLUE_LT }}>QUANTER</span>
          <span style={{ color: TEXT_MUT }}>.HISTORY</span>
        </span>
      </div>

      {/* 통계 */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px" }}>
        {[
          { label: "전체", value: totalTrades, color: TEXT_PRI },
          { label: "LONG", value: longTrades, color: GREEN },
          { label: "SHORT", value: shortTrades, color: RED },
          { label: "승률", value: totalTrades > 0 ? `${Math.round(winTrades/totalTrades*100)}%` : "0%", color: AMBER },
        ].map(stat => (
          <div key={stat.label} style={{ 
            flex: 1, 
            background: SURFACE,
            border: `0.5px solid ${BORDER}`,
            borderRadius: 8,
            padding: "10px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 8, color: TEXT_MUT, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 4, padding: "0 18px 12px" }}>
        {[
          { id: "all", label: "전체" },
          { id: "long", label: "LONG" },
          { id: "short", label: "SHORT" },
          { id: "exit", label: "청산" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 12px",
              background: filter === f.id ? BLUE_LT : SURFACE,
              border: `0.5px solid ${filter === f.id ? BLUE_LT : BORDER}`,
              borderRadius: 6,
              color: filter === f.id ? "#fff" : TEXT_MUT,
              fontSize: 10,
              cursor: "pointer"
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 거래 내역 테이블 */}
      <div style={{ padding: "0 18px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: TEXT_HINT }}>로딩 중...</div>
        ) : filteredTrades.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: TEXT_HINT }}>
            거래 내역이 없습니다
          </div>
        ) : (
          <div style={{ 
            background: SURFACE, 
            border: `0.5px solid ${BORDER}`, 
            borderRadius: 12, 
            overflow: "hidden" 
          }}>
            {/* 헤더 */}
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "70px 50px 40px 60px 60px 50px 50px",
              padding: "10px 12px",
              background: BG,
              fontSize: 9,
              color: TEXT_MUT,
              fontWeight: 600,
              letterSpacing: "0.5px"
            }}>
              <span>시간</span>
              <span>티커</span>
              <span>방향</span>
              <span>진입</span>
              <span>청산</span>
              <span>수익</span>
              <span>상태</span>
            </div>
            
            {/* 데이터 */}
            {filteredTrades.map((trade, i) => (
              <div key={i} style={{ 
                display: "grid",
                gridTemplateColumns: "70px 50px 40px 60px 60px 50px 50px",
                padding: "10px 12px",
                fontSize: 10,
                borderTop: `0.5px solid ${BORDER}`,
                alignItems: "center"
              }}>
                <span style={{ color: TEXT_MUT }}>{trade.Timestamp}</span>
                <span style={{ 
                  color: trade.Side === "LONG" ? GREEN : RED,
                  fontWeight: 600 
                }}>{trade.Ticker}</span>
                <span style={{ 
                  color: trade.Side === "LONG" ? GREEN : RED,
                  fontSize: 9
                }}>{trade.Side}</span>
                <span>{trade.Entry}</span>
                <span>{trade.Exit || "-"}</span>
                <span style={{ 
                  color: trade.Profit?.startsWith("+") ? GREEN : trade.Profit?.startsWith("-") ? RED : TEXT_MUT,
                  fontWeight: 600
                }}>{trade.Profit || "-"}</span>
                <span style={{ 
                  color: trade.Status === "ENTRY" ? BLUE : trade.Status === "EXIT" ? AMBER : TEXT_MUT,
                  fontSize: 9
                }}>{trade.Status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <StockNavBar active="history" />
    </div>
  )
}
