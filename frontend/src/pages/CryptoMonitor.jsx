import { useState, useEffect, useCallback } from "react"
import { CryptoNavBar } from "../components/NavBar"
import { supabase } from "../supabase"

const BLUE    = "#3B5BDB"
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

const SYMBOLS = [
  { id: "BTCUSDT", label: "BTC", color: AMBER },
  { id: "ETHUSDT", label: "ETH", color: "#627EEA" },
  { id: "SOLUSDT", label: "SOL", color: "#9945FF" },
]

function CIBar({ value }) {
  // CI: 낮을수록 트렌드, 높을수록 횡보 (기준 38.2)
  const pct = Math.min(100, Math.max(0, value))
  const isTrend = value < 38.2
  const color = isTrend ? GREEN : value < 50 ? AMBER : RED
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: TEXT_HINT }}>CI (Choppiness)</span>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value?.toFixed(1) ?? "--"}</span>
      </div>
      <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: 4, background: color, borderRadius: 2, transition: "width 0.5s" }}/>
      </div>
      <div style={{ fontSize: 8, color: TEXT_HINT, marginTop: 3 }}>
        {isTrend ? "📈 TREND" : "↔ RANGE"}
      </div>
    </div>
  )
}

function ZScoreBar({ value }) {
  // Z-Score: -2~+2 정상, 벗어나면 과매수/과매도
  const normalized = Math.min(100, Math.max(0, ((value + 3) / 6) * 100))
  const color = Math.abs(value) > 2 ? RED : Math.abs(value) > 1.5 ? AMBER : GREEN
  const label = value > 2 ? "과매수" : value < -2 ? "과매도" : "중립"
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: TEXT_HINT }}>Z-Score</span>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value?.toFixed(2) ?? "--"}</span>
      </div>
      <div style={{ height: 4, background: BORDER, borderRadius: 2, position: "relative" }}>
        {/* 중앙선 */}
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: 4, background: TEXT_HINT }}/>
        <div style={{ width: `${normalized}%`, height: 4, background: color, borderRadius: 2, transition: "width 0.5s" }}/>
      </div>
      <div style={{ fontSize: 8, color: TEXT_HINT, marginTop: 3 }}>{label}</div>
    </div>
  )
}

export default function CryptoMonitor() {
  const [indicators, setIndicators] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState("BTCUSDT")

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = {
        "Authorization": `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json"
      }
      const res = await fetch(`${TRADING_API_URL}/status`, { headers })
      if (res.ok) {
        const json = await res.json()
        setIndicators(json.indicators || {})
        setLastUpdate(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
        setLoading(false)
      }
    } catch (e) {
      console.error("지표 조회 실패:", e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [fetchData])

  const ind = indicators[selected] || {}
  const sym = SYMBOLS.find(s => s.id === selected)

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, paddingBottom: 100 }}>
      
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: BLUE_LT }}>QUANTER</span>
          <span style={{ color: TEXT_MUT }}>.MONITOR</span>
        </span>
        {lastUpdate && <span style={{ fontSize: 9, color: TEXT_HINT }}>{lastUpdate}</span>}
      </div>

      {/* 심볼 선택 */}
      <div style={{ display: "flex", gap: 8, padding: "16px 18px" }}>
        {SYMBOLS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              flex: 1, padding: "12px",
              background: selected === s.id ? `${s.color}20` : SURFACE,
              border: `1.5px solid ${selected === s.id ? s.color : BORDER}`,
              borderRadius: 12, cursor: "pointer",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 13, fontWeight: 700,
              color: selected === s.id ? s.color : TEXT_MUT,
              transition: "all 0.2s"
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: TEXT_HINT }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>데이터 로딩 중...</div>
          <div style={{ fontSize: 10, color: TEXT_HINT }}>Trading API에 연결 중</div>
        </div>
      ) : (
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 현재가 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, marginBottom: 8, letterSpacing: "1px" }}>현재가</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 800, color: sym?.color }}>
              ${ind.close?.toLocaleString() ?? "--"}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: TEXT_HINT }}>HMA</div>
                <div style={{ fontSize: 13, color: TEXT_PRI, fontWeight: 600 }}>${ind.hma?.toFixed(2) ?? "--"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT_HINT }}>ATR</div>
                <div style={{ fontSize: 13, color: TEXT_PRI, fontWeight: 600 }}>${ind.atr?.toFixed(2) ?? "--"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT_HINT }}>레짐</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ind.regime === "TREND" ? GREEN : AMBER }}>
                  {ind.regime ?? "--"}
                </div>
              </div>
            </div>
          </div>

          {/* 지표 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px" }}>기술적 지표</div>
            <CIBar value={ind.ci} />
            <ZScoreBar value={ind.z_score} />
          </div>

          {/* 시그널 해석 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 14 }}>시그널 해석</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  label: "CI 해석",
                  value: ind.ci < 38.2 ? "강한 추세 진행 중" : ind.ci < 50 ? "추세 약화 중" : "횡보/혼조 구간",
                  color: ind.ci < 38.2 ? GREEN : ind.ci < 50 ? AMBER : RED
                },
                {
                  label: "Z-Score 해석",
                  value: ind.z_score > 2 ? "과매수 — 하락 가능성" : ind.z_score < -2 ? "과매도 — 상승 가능성" : "정상 범위",
                  color: Math.abs(ind.z_score) > 2 ? RED : GREEN
                },
                {
                  label: "HMA 대비",
                  value: ind.close > ind.hma ? "현재가 HMA 위 (강세)" : "현재가 HMA 아래 (약세)",
                  color: ind.close > ind.hma ? GREEN : RED
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: TEXT_MUT }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{value || "--"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 모든 심볼 요약 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 14 }}>전체 요약</div>
            {SYMBOLS.map(s => {
              const i = indicators[s.id] || {}
              return (
                <div key={s.id} onClick={() => setSelected(s.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${BORDER}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: TEXT_MUT }}>CI: {i.ci?.toFixed(1) ?? "--"}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUT }}>Z: {i.z_score?.toFixed(2) ?? "--"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i.regime === "TREND" ? GREEN : AMBER }}>{i.regime ?? "--"}</span>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      <CryptoNavBar active="monitor" />
    </div>
  )
}
