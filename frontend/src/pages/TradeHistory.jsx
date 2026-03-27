import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { NavBar } from "./Home"
import { fetchTrades } from "../api"

const BLUE     = "#3B5BDB"
const BLUE_LT  = "#4C6EF5"
const BG       = "#080c10"
const SURFACE  = "#0d1218"
const BORDER   = "#1c2530"
const TEXT_PRI = "#e2e8f0"
const TEXT_MUT = "#4a5568"
const TEXT_HINT= "#2a3545"
const GREEN    = "#22c55e"
const RED      = "#ef4444"

const SYM_FILTERS = ["전체", "BTC", "ETH", "SOL"]

// 봇 거래 목업 (나중에 Supabase 연동)
const BOT_TRADES = [
  { id:1,  sym:"ETH", pair:"ETHUSDT", side:"LONG",  logic:"RANGE_Z",   entryTime:"08:35", exitTime:"09:12", entry:2143.40, exit:2149.36, pnl:0.18,  roe:12.4,  lev:50, size:0.67, reason:"트레일링 스탑 도달", date:"2026-03-23" },
  { id:2,  sym:"SOL", pair:"SOLUSDT", side:"SHORT", logic:"TREND_HMA", entryTime:"07:20", exitTime:"07:58", entry:89.28,   exit:88.34,   pnl:-0.04, roe:-3.1,  lev:50, size:0.67, reason:"손절 도달",          date:"2026-03-23" },
  { id:3,  sym:"BTC", pair:"BTCUSDT", side:"LONG",  logic:"TREND_HMA", entryTime:"06:50", exitTime:"07:34", entry:84210,   exit:84972,   pnl:0.11,  roe:8.1,   lev:50, size:0.67, reason:"트레일링 스탑 도달", date:"2026-03-23" },
  { id:4,  sym:"ETH", pair:"ETHUSDT", side:"LONG",  logic:"RANGE_Z",   entryTime:"22:10", exitTime:"23:02", entry:2108.20, exit:2130.44, pnl:0.22,  roe:16.2,  lev:50, size:0.67, reason:"트레일링 스탑 도달", date:"2026-03-22" },
  { id:5,  sym:"ETH", pair:"ETHUSDT", side:"SHORT", logic:"TREND_HMA", entryTime:"18:40", exitTime:"19:15", entry:2122.10, exit:2131.02, pnl:-0.05, roe:-4.2,  lev:50, size:0.67, reason:"손절 도달",          date:"2026-03-22" },
  { id:6,  sym:"BTC", pair:"BTCUSDT", side:"LONG",  logic:"TREND_HMA", entryTime:"14:22", exitTime:"15:08", entry:83540,   exit:84210,   pnl:0.09,  roe:6.8,   lev:50, size:0.67, reason:"트레일링 스탑 도달", date:"2026-03-22" },
  { id:7,  sym:"SOL", pair:"SOLUSDT", side:"LONG",  logic:"RANGE_Z",   entryTime:"10:05", exitTime:"11:20", entry:87.42,   exit:89.18,   pnl:0.14,  roe:10.2,  lev:50, size:0.67, reason:"익절 도달",          date:"2026-03-22" },
]

// ============================================================
// 봇 거래 상세
// ============================================================
function BotTradeDetail({ trade, onBack }) {
  const isPos = trade.pnl >= 0
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: "4px 4px 4px 0" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>봇 거래 상세</span>
      </div>
      <div style={{ padding: "24px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: isPos ? "#1a3a2a" : "#3a1a1a",
            borderRadius: 20, padding: "5px 14px", marginBottom: 14
          }}>
            <span style={{ fontSize: 10, color: isPos ? GREEN : RED, letterSpacing: "1px" }}>
              {trade.side} · 청산완료
            </span>
          </div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 36, fontWeight: 900, color: isPos ? GREEN : RED, marginBottom: 4 }}>
            {isPos ? "+" : "-"}${Math.abs(trade.pnl).toFixed(2)}
          </div>
          <div style={{ fontSize: 15, color: isPos ? GREEN : RED }}>{isPos ? "+" : "-"}{Math.abs(trade.roe)}% ROI</div>
        </div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 12 }}>거래 정보</div>
          {[
            ["종목",        trade.pair],
            ["전략",        trade.logic],
            ["레버리지",    `${trade.lev}x`],
            ["진입가",      `$${trade.entry.toLocaleString()}`],
            ["청산가",      `$${trade.exit.toLocaleString()}`],
            ["진입 시각",   trade.entryTime],
            ["청산 시각",   trade.exitTime],
            ["포지션 크기", `$${trade.size}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>청산 사유</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: BLUE_LT, flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: TEXT_PRI }}>{trade.reason}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 전체 거래 상세
// ============================================================
function AllTradeDetail({ trade, onBack }) {
  const isPos = trade.realized_pnl >= 0
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: "4px 4px 4px 0" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>전체 거래 상세</span>
      </div>
      <div style={{ padding: "24px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: isPos ? "#1a3a2a" : trade.realized_pnl === 0 ? SURFACE : "#3a1a1a",
            borderRadius: 20, padding: "5px 14px", marginBottom: 14
          }}>
            <span style={{ fontSize: 10, color: isPos ? GREEN : trade.realized_pnl === 0 ? TEXT_MUT : RED, letterSpacing: "1px" }}>
              {trade.side === "BUY" ? "LONG" : "SHORT"} · 체결완료
            </span>
          </div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 36, fontWeight: 900, color: isPos ? GREEN : trade.realized_pnl === 0 ? TEXT_MUT : RED, marginBottom: 4 }}>
            {trade.realized_pnl === 0 ? "--" : `${isPos ? "+" : "-"}$${Math.abs(trade.realized_pnl).toFixed(4)}`}
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUT }}>실현 손익</div>
        </div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 12 }}>체결 정보</div>
          {[
            ["종목",     trade.symbol],
            ["방향",     trade.side === "BUY" ? "LONG (매수)" : "SHORT (매도)"],
            ["체결가",   `$${trade.price.toLocaleString()}`],
            ["수량",     trade.qty],
            ["수수료",   `$${trade.commission.toFixed(4)}`],
            ["체결 시각", trade.time],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 봇 거래 탭
// ============================================================
function BotTradesTab() {
  const [filter,   setFilter]   = useState("전체")
  const [selected, setSelected] = useState(null)

  if (selected) return <BotTradeDetail trade={selected} onBack={() => setSelected(null)}/>

  const filtered  = filter === "전체" ? BOT_TRADES : BOT_TRADES.filter(t => t.sym === filter)
  const totalPnl  = filtered.reduce((s, t) => s + t.pnl, 0)
  const winRate   = filtered.length > 0 ? Math.round((filtered.filter(t => t.pnl > 0).length / filtered.length) * 100) : 0
  const grouped   = filtered.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* 요약 */}
      <div style={{ display: "flex", gap: 8, padding: "14px 18px 0" }}>
        {[
          { label: "총 수익", value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? GREEN : RED },
          { label: "승률",    value: `${winRate}%`,          color: BLUE_LT  },
          { label: "총 거래", value: `${filtered.length}`,   color: TEXT_PRI },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 10px" }}>
            <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 심볼 필터 */}
      <div style={{ display: "flex", borderBottom: `0.5px solid ${BORDER}`, margin: "12px 0 0", padding: "0 18px" }}>
        {SYM_FILTERS.map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "7px 4px", textAlign: "center",
            fontSize: 11, cursor: "pointer",
            color: filter === f ? BLUE_LT : TEXT_HINT,
            borderBottom: `2px solid ${filter === f ? BLUE_LT : "transparent"}`,
            marginBottom: -1, transition: "all .2s"
          }}>{f}</div>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: TEXT_HINT }}>
            봇 거래 내역이 없어요
          </div>
        ) : (
          Object.entries(grouped).map(([date, trades]) => (
            <div key={date}>
              <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", padding: "12px 0 6px" }}>{date}</div>
              {trades.map((t, i) => {
                const isPos = t.pnl >= 0
                return (
                  <div key={t.id} onClick={() => setSelected(t)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 0", cursor: "pointer",
                    borderBottom: i < trades.length - 1 ? `0.5px solid ${BORDER}` : "none"
                  }}>
                    <div style={{
                      width: 32, height: 32, background: SURFACE,
                      border: `0.5px solid ${BORDER}`, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontFamily: "'Orbitron', sans-serif",
                      fontSize: 8, fontWeight: 700, color: BLUE_LT
                    }}>{t.sym}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_PRI }}>{t.pair}</span>
                        <span style={{
                          fontSize: 9, padding: "2px 6px", borderRadius: 3,
                          letterSpacing: "1px", fontWeight: 700,
                          background: t.side === "LONG" ? "#1a3a2a" : "#3a1a1a",
                          color: t.side === "LONG" ? GREEN : RED
                        }}>{t.side}</span>
                        <span style={{ fontSize: 9, color: TEXT_HINT }}>{t.logic}</span>
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MUT }}>{t.entryTime} → {t.exitTime}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: isPos ? GREEN : RED }}>
                        {isPos ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, color: isPos ? GREEN : RED }}>{isPos ? "+" : "-"}{Math.abs(t.roe)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// 전체 거래 탭
// ============================================================
function AllTradesTab() {
  const [filter,   setFilter]   = useState("전체")
  const [trades,   setTrades]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchTrades().then(d => { setTrades(d); setLoading(false) })
  }, [])

  if (selected) return <AllTradeDetail trade={selected} onBack={() => setSelected(null)}/>

  const filtered  = filter === "전체" ? trades : trades.filter(t => t.symbol.startsWith(filter))
  const totalPnl  = filtered.reduce((s, t) => s + t.realized_pnl, 0)
  const wins      = filtered.filter(t => t.realized_pnl > 0).length
  const winRate   = filtered.length > 0 ? Math.round((wins / filtered.length) * 100) : 0
  const grouped   = filtered.reduce((acc, t) => {
    const date = t.time.split(" ")[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(t)
    return acc
  }, {})

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* 요약 */}
      <div style={{ display: "flex", gap: 8, padding: "14px 18px 0" }}>
        {[
          { label: "총 손익", value: loading ? "--" : `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? GREEN : RED },
          { label: "승률",    value: loading ? "--" : `${winRate}%`,        color: BLUE_LT  },
          { label: "총 거래", value: loading ? "--" : `${filtered.length}`, color: TEXT_PRI },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 10px" }}>
            <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 심볼 필터 */}
      <div style={{ display: "flex", borderBottom: `0.5px solid ${BORDER}`, margin: "12px 0 0", padding: "0 18px" }}>
        {SYM_FILTERS.map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "7px 4px", textAlign: "center",
            fontSize: 11, cursor: "pointer",
            color: filter === f ? BLUE_LT : TEXT_HINT,
            borderBottom: `2px solid ${filter === f ? BLUE_LT : "transparent"}`,
            marginBottom: -1, transition: "all .2s"
          }}>{f}</div>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: TEXT_HINT }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: TEXT_HINT }}>거래 내역이 없어요</div>
        ) : (
          Object.entries(grouped).map(([date, trades]) => (
            <div key={date}>
              <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", padding: "12px 0 6px" }}>{date}</div>
              {trades.map((t, i) => {
                const isPos = t.realized_pnl > 0
                const sym   = t.symbol.replace("USDT", "")
                return (
                  <div key={t.id} onClick={() => setSelected(t)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 0", cursor: "pointer",
                    borderBottom: i < trades.length - 1 ? `0.5px solid ${BORDER}` : "none"
                  }}>
                    <div style={{
                      width: 32, height: 32, background: SURFACE,
                      border: `0.5px solid ${BORDER}`, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontFamily: "'Orbitron', sans-serif",
                      fontSize: 8, fontWeight: 700, color: BLUE_LT
                    }}>{sym}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_PRI }}>{t.symbol}</span>
                        <span style={{
                          fontSize: 9, padding: "2px 6px", borderRadius: 3,
                          letterSpacing: "1px", fontWeight: 700,
                          background: t.side === "BUY" ? "#1a3a2a" : "#3a1a1a",
                          color: t.side === "BUY" ? GREEN : RED
                        }}>{t.side === "BUY" ? "LONG" : "SHORT"}</span>
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MUT }}>
                        ${t.price.toLocaleString()} · {t.time.split(" ")[1]}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: isPos ? GREEN : t.realized_pnl === 0 ? TEXT_MUT : RED }}>
                        {t.realized_pnl === 0 ? "--" : `${isPos ? "+" : "-"}$${Math.abs(t.realized_pnl).toFixed(4)}`}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MUT }}>qty: {t.qty}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// 메인
// ============================================================
export default function TradeHistory() {
  const [mode, setMode] = useState("bot")
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* 헤더 */}
      <div style={{ padding: "14px 18px 0", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px", marginBottom: 12 }}>
          거래 내역
        </div>
        {/* 모드 탭 */}
        <div style={{ display: "flex", gap: 0 }}>
          <div onClick={() => setMode("bot")} style={{
            flex: 1, padding: "9px 0", textAlign: "center",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            color: mode === "bot" ? BLUE_LT : TEXT_MUT,
            borderBottom: `2px solid ${mode === "bot" ? BLUE_LT : "transparent"}`,
            marginBottom: -1, transition: "all .2s"
          }}>
            🤖 봇 거래
          </div>
          <div onClick={() => setMode("all")} style={{
            flex: 1, padding: "9px 0", textAlign: "center",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            color: mode === "all" ? BLUE_LT : TEXT_MUT,
            borderBottom: `2px solid ${mode === "all" ? BLUE_LT : "transparent"}`,
            marginBottom: -1, transition: "all .2s"
          }}>
            📊 전체 거래
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mode === "bot" ? <BotTradesTab/> : <AllTradesTab/>}
      </div>

      <NavBar navigate={navigate} active="history"/>
    </div>
  )
}
