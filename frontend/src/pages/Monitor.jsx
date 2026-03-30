import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { NavBar } from "./Home"
import { fetchSignals } from "../api"
import { BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED } from '../theme'

const CATEGORIES = [
  { id: "all",       label: "전체"   },
  { id: "index",     label: "지수"   },
  { id: "sector",    label: "섹터"   },
  { id: "stock",     label: "주식"   },
  { id: "crypto",    label: "크립토" },
  { id: "commodity", label: "원자재" },
  { id: "theme",     label: "테마"   },
  { id: "intl",      label: "해외"   },
  { id: "bond",      label: "채권"   },
]

export default function Monitor() {
  const [category, setCategory]   = useState("all")
  const [signals, setSignals]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const navigate = useNavigate()

  const pollSignals = useCallback(async () => {
    try {
      const data = await fetchSignals()
      setSignals(data.signals || [])
      setLastUpdate(new Date().toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit", second:"2-digit" }))
      setLoading(false)
    } catch (err) {
      console.error("시그널 페칭 실패:", err)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    pollSignals()
    const id = setInterval(pollSignals, 5000)
    return () => clearInterval(id)
  }, [pollSignals])

  // category 필드 직접 비교 (문자열 파싱 X)
  const filteredSignals = signals.filter(s =>
    category === "all" ? true : s.category === category
  )

  const longCount  = signals.filter(s => s.signal === "LONG").length
  const shortCount = signals.filter(s => s.signal === "SHORT").length
  const waitCount  = signals.filter(s => s.signal === "WAIT").length

  return (
    <div style={{ background: BG, minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", color: TEXT_PRI, paddingBottom: 100 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:`0.5px solid ${BORDER}` }}>
        <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: BLUE_LT }}>QUANTER</span>.MONITOR
        </div>
        <div style={{ fontSize: 10, color: TEXT_MUT }}>{lastUpdate && `업데이트: ${lastUpdate}`}</div>
      </div>

      <div style={{ display:"flex", gap: 8, padding:"12px 18px" }}>
        {[
          { label:"LONG",  value: longCount,  color: GREEN   },
          { label:"SHORT", value: shortCount, color: RED     },
          { label:"WAIT",  value: waitCount,  color: TEXT_MUT},
        ].map(stat => (
          <div key={stat.label} style={{ flex:1, background: SURFACE, border:`0.5px solid ${BORDER}`, borderRadius: 8, padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize: 8, color: TEXT_MUT, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 카테고리 탭 — category 필드 기반 */}
      <div style={{ display:"flex", gap: 4, padding:"0 18px 12px", flexWrap:"wrap" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
            padding:"6px 12px",
            background: category === cat.id ? BLUE_LT : SURFACE,
            border:`0.5px solid ${category === cat.id ? BLUE_LT : BORDER}`,
            borderRadius: 6,
            color: category === cat.id ? "#fff" : TEXT_MUT,
            fontSize: 10, cursor:"pointer"
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"0 18px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px", color: TEXT_HINT }}>로딩 중...</div>
        ) : filteredSignals.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px", color: TEXT_HINT }}>시그널 없음</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
            {filteredSignals.map(s => (
              <div key={s.symbol} style={{
                background: SURFACE,
                border:`0.5px solid ${s.signal==="LONG" ? GREEN : s.signal==="SHORT" ? RED : BORDER}`,
                borderRadius: 10, padding:"12px 14px"
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize: 13, fontWeight: 700 }}>{s.symbol}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{s.name}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{
                      fontSize: 9, padding:"2px 8px", borderRadius: 4,
                      background: s.signal==="LONG" ? `${GREEN}22` : s.signal==="SHORT" ? `${RED}22` : SURFACE,
                      color: s.signal==="LONG" ? GREEN : s.signal==="SHORT" ? RED : TEXT_MUT,
                      fontWeight: 700, marginBottom: 4
                    }}>{s.signal}</div>
                    <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize: 12, color: TEXT_PRI }}>
                      {s.score > 0 ? "+" : ""}{s.score.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap: 12, marginTop: 8, fontSize: 9, color: TEXT_MUT }}>
                  <span>CI: {s.ci}</span>
                  <span>Z: {s.z}</span>
                  <span>{s.regime}</span>
                  <span style={{ marginLeft:"auto", textTransform:"uppercase" }}>{s.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <NavBar navigate={navigate} active="monitor" />
    </div>
  )
}
