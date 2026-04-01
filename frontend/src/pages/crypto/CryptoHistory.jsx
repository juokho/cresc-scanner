import { useState, useEffect } from "react"
import { CryptoNavBar } from "../components/NavBar"
import { supabase } from "../supabase"

const BLUE_LT = "#4C6EF5"
const BG      = "#080c10"
const SURFACE = "#0d1218"
const BORDER  = "#1c2530"
const TEXT_PRI = "#e2e8f0"
const TEXT_MUT = "#4a5568"
const TEXT_HINT = "#2a3545"
const GREEN   = "#22c55e"
const RED     = "#ef4444"
const AMBER   = "#f59e0b"

const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "http://localhost:8001"

export default function CryptoHistory() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = { "Authorization": `Bearer ${session?.access_token || ""}` }
        const res = await fetch(`${TRADING_API_URL}/status`, { headers })
        if (res.ok) {
          const json = await res.json()
          setLogs(json.execution_logs || [])
        }
      } catch (e) {
        console.error("로그 조회 실패:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = logs.filter(l => {
    if (filter === "all") return true
    if (filter === "success") return l.status === "SUCCESS"
    if (filter === "error") return l.status === "ERROR"
    if (filter === "exit") return l.side === "EXIT"
    return true
  })

  const successCount = logs.filter(l => l.status === "SUCCESS").length
  const errorCount = logs.filter(l => l.status === "ERROR").length

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, paddingBottom: 100 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: BLUE_LT }}>QUANTER</span>
          <span style={{ color: TEXT_MUT }}>.HISTORY</span>
        </span>
      </div>

      {/* 통계 */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px" }}>
        {[
          { label: "전체", value: logs.length, color: TEXT_PRI },
          { label: "성공", value: successCount, color: GREEN },
          { label: "오류", value: errorCount, color: RED },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: TEXT_HINT, marginBottom: 4, letterSpacing: "0.5px" }}>{s.label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 6, padding: "0 18px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
        {[
          { id: "all", label: "전체" },
          { id: "success", label: "✓ 성공" },
          { id: "exit", label: "청산" },
          { id: "error", label: "오류" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, padding: "6px 14px",
            background: filter === f.id ? BLUE_LT : SURFACE,
            border: `0.5px solid ${filter === f.id ? BLUE_LT : BORDER}`,
            borderRadius: 20, color: filter === f.id ? "#fff" : TEXT_MUT,
            fontSize: 10, cursor: "pointer"
          }}>{f.label}</button>
        ))}
      </div>

      {/* 로그 목록 */}
      <div style={{ padding: "0 18px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: TEXT_HINT }}>로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: TEXT_HINT }}>거래 내역이 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((log, i) => {
              const isSuccess = log.status === "SUCCESS"
              const isError = log.status === "ERROR"
              const isExit = log.side === "EXIT"
              const borderColor = isError ? RED : isExit ? AMBER : isSuccess ? GREEN : BORDER
              return (
                <div key={i} style={{ background: SURFACE, border: `0.5px solid ${borderColor}40`, borderRadius: 12, padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700 }}>{log.symbol}</span>
                      <span style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                        background: log.side === "LONG" ? `${GREEN}22` : log.side === "SHORT" ? `${RED}22` : `${AMBER}22`,
                        color: log.side === "LONG" ? GREEN : log.side === "SHORT" ? RED : AMBER
                      }}>{log.side}</span>
                    </div>
                    <span style={{ fontSize: 9, color: isError ? RED : isSuccess ? GREEN : TEXT_MUT, fontWeight: 600 }}>
                      {isError ? "❌ ERROR" : isSuccess ? "✓ SUCCESS" : log.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_MUT }}>
                    <span>{log.reason}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      {log.price > 0 && <span>${log.price.toLocaleString()}</span>}
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CryptoNavBar active="history" />
    </div>
  )
}
