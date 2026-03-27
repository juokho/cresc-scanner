import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { NavBar } from "./Home"
import { fetchSignals } from "../api"
import useBotStatus from "../hooks/useBotStatus"

const BLUE_LT  = "#4C6EF5"
const BG       = "#080c10"
const SURFACE  = "#0d1218"
const BORDER   = "#1c2530"
const TEXT_PRI = "#e2e8f0"
const TEXT_MUT = "#4a5568"
const TEXT_HINT= "#2a3545"
const GREEN    = "#22c55e"
const RED      = "#ef4444"

const SYMBOLS = ["BTC", "ETH", "SOL"]
const SYM_MAP = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT" }

export default function Monitor() {
  const [sym,        setSym]        = useState("ETH")
  const [signals,    setSignals]    = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const navigate = useNavigate()

  // 공유 훅으로 서버 상태 / 지표 가져오기
  const { botRunning: connected, indicators } = useBotStatus(3000)

  const pollSignals = useCallback(async () => {
    try {
      const sig = await fetchSignals()
      setSignals(Array.isArray(sig) ? sig : [])
      setLastUpdate(new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }))
    } catch (err) {
      console.error("시그널 페칭 실패:", err)
    }
  }, [])

  useEffect(() => {
    pollSignals()
    const id = setInterval(pollSignals, 3000)
    return () => clearInterval(id)
  }, [pollSignals])

  const fullSym    = SYM_MAP[sym]
  const data       = indicators[fullSym]
  const isRange    = data?.regime === "RANGE"
  const symSignals = signals.filter(s => s.symbol === fullSym)

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* 헤더 */}
      <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>모니터링</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? GREEN : TEXT_HINT }}/>
          <span style={{ fontSize: 10, color: connected ? GREEN : TEXT_HINT }}>
            {connected ? `LIVE · ${lastUpdate}` : "서버 연결 대기중"}
          </span>
        </div>
      </div>

      {/* 심볼 탭 */}
      <div style={{ display: "flex", borderBottom: `0.5px solid ${BORDER}`, margin: "12px 0 0", padding: "0 18px" }}>
        {SYMBOLS.map(s => (
          <div key={s} onClick={() => setSym(s)} style={{ flex: 1, padding: "9px 4px", textAlign: "center", fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", color: sym === s ? BLUE_LT : TEXT_HINT, borderBottom: `2px solid ${sym === s ? BLUE_LT : "transparent"}`, marginBottom: -1, transition: "all .2s" }}>{s}</div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

        {Object.keys(indicators).length === 0 && (
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "20px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: TEXT_HINT, marginBottom: 4 }}>데이터를 계산 중입니다...</div>
            <div style={{ fontSize: 10, color: TEXT_HINT }}>봇 가동 후 최대 5분 내에 첫 지표가 생성됩니다.</div>
          </div>
        )}

        {data && (
          <div style={{ background: isRange ? SURFACE : "#0d1420", border: `0.5px solid ${isRange ? BORDER : "#3B5BDB"}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 6 }}>현재 국면</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: isRange ? TEXT_MUT : BLUE_LT }}>
                {isRange ? "📉 RANGE" : "📊 TREND"}
              </div>
              <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 4 }}>{isRange ? "Z-Score 전략 활성" : "HMA 크로스 전략 활성"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 4 }}>5분봉 기준</div>
              <div style={{ fontSize: 11, color: TEXT_MUT }}>{fullSym}.P</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: TEXT_PRI, marginTop: 4 }}>${data.close?.toLocaleString()}</div>
            </div>
          </div>
        )}

        {data && (
          <div>
            <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>INDICATORS</div>
            <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px" }}>
              {[
                { label: "Choppiness Index (CI)", value: data.ci?.toFixed(1) ?? "--", desc: data.ci < 40 ? "추세 구간 (< 40)" : "횡보 구간 (≥ 40)", color: data.ci < 40 ? BLUE_LT : TEXT_MUT, bar: Math.min(data.ci ?? 0, 100) },
                { label: "Z-Score", value: data.z_score?.toFixed(2) ?? "--", desc: Math.abs(data.z_score ?? 0) >= 2 ? "과매수/과매도 구간" : "중립 구간", color: Math.abs(data.z_score ?? 0) >= 2 ? GREEN : TEXT_MUT, bar: Math.min(Math.abs(data.z_score ?? 0) * 25, 100) },
                { label: "HMA (21)", value: data.hma?.toLocaleString() ?? "--", desc: "Hull Moving Average", color: TEXT_PRI, bar: null },
              ].map(({ label, value, desc, color, bar }, i, arr) => (
                <div key={label} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: bar !== null ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 11, color: TEXT_PRI, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 1 }}>{desc}</div>
                    </div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
                  </div>
                  {bar !== null && (
                    <div style={{ height: 3, background: BORDER, borderRadius: 2 }}>
                      <div style={{ width: `${bar}%`, height: 3, background: color, borderRadius: 2, transition: "width .5s" }}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>SIGNAL LOG {symSignals.length > 0 && `· ${symSignals.length}개`}</div>
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px" }}>
            {symSignals.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: TEXT_HINT }}>시그널 없음</div>
            ) : (
              symSignals.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < symSignals.length - 1 ? `0.5px solid ${BORDER}` : "none" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.side === "LONG" ? GREEN : RED, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: TEXT_PRI }}>{s.side} · {s.logic}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 1 }}>{s.time}</div>
                  </div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: TEXT_MUT }}>${parseFloat(s.entry || 0).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>전체 심볼 요약</div>
          <div style={{ display: "flex", gap: 8 }}>
            {SYMBOLS.map(s => {
              const d = indicators[SYM_MAP[s]]
              const isTrend = d?.regime === "TREND"
              return (
                <div key={s} onClick={() => setSym(s)} style={{ flex: 1, background: sym === s ? "#0d1420" : SURFACE, border: `0.5px solid ${sym === s ? "#3B5BDB" : BORDER}`, borderRadius: 10, padding: "11px 8px", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: sym === s ? BLUE_LT : TEXT_MUT, marginBottom: 4 }}>{s}</div>
                  {d ? (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 500, color: isTrend ? BLUE_LT : TEXT_MUT, marginBottom: 2 }}>{isTrend ? "TREND" : "RANGE"}</div>
                      <div style={{ fontSize: 9, color: TEXT_HINT }}>CI:{d.ci?.toFixed(1)}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 9, color: TEXT_HINT }}>대기중</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <NavBar navigate={navigate} active="monitor"/>
    </div>
  )
}
