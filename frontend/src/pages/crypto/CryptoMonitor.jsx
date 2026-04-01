import { useState, useEffect, useCallback } from "react"
import { CryptoNavBar } from "../../components/NavBar"
import { supabase } from "../../supabase"
import useBotStatus from "../../hooks/useBotStatus"

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

// BTC, ETH, SOL만 표시
const SYMBOLS = ["BTC", "ETH", "SOL"]
const SYM_MAP = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT" }
const SYM_COLORS = { BTC: AMBER, ETH: "#627EEA", SOL: "#9945FF" }

function LogoIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <text x="64" y="78" textAnchor="middle" fill="white" fontSize="56" fontWeight="700" fontFamily="'Orbitron', sans-serif">$</text>
      <circle cx="98" cy="30" r="20" fill="#F7931A"/>
      <text x="98" y="38" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="'Orbitron', sans-serif">₿</text>
      <circle cx="64" cy="64" r="50" stroke="white" strokeWidth="2" fill="none" opacity="0.1"/>
    </svg>
  )
}

export default function CryptoMonitor() {
  const [sym,        setSym]        = useState("BTC")
  const [lastUpdate, setLastUpdate] = useState(null)

  // 공유 훅으로 서버 상태 / 지표 가져오기
  const { botRunning: connected, indicators } = useBotStatus(3000)

  // 마지막 업데이트 시간 갱신
  useEffect(() => {
    if (Object.keys(indicators).length > 0) {
      setLastUpdate(new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }))
    }
  }, [indicators])

  const fullSym    = SYM_MAP[sym]
  const data       = indicators[fullSym]
  const isRange    = data?.regime === "RANGE"

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", paddingBottom: 100 }}>
      
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={26}/>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>
            <span style={{ color: TEXT_MUT }}>.MONITOR</span>
          </span>
        </div>
        {lastUpdate && <span style={{ fontSize: 9, color: TEXT_HINT }}>{lastUpdate}</span>}
      </div>

      {/* 연결 상태 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? GREEN : TEXT_HINT }}/>
        <span style={{ fontSize: 10, color: connected ? GREEN : TEXT_HINT }}>
          {connected ? "LIVE" : "서버 연결 대기중"}
        </span>
      </div>

      {/* 심볼 선택 - 기존 스타일 유지 */}
      <div style={{ display: "flex", gap: 8, padding: "16px 18px" }}>
        {SYMBOLS.map(s => {
          const isSelected = sym === s
          const color = SYM_COLORS[s]
          return (
            <button
              key={s}
              onClick={() => setSym(s)}
              style={{
                flex: 1, padding: "12px",
                background: isSelected ? `${color}20` : SURFACE,
                border: `1.5px solid ${isSelected ? color : BORDER}`,
                borderRadius: 12, cursor: "pointer",
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13, fontWeight: 700,
                color: isSelected ? color : TEXT_MUT,
                transition: "all 0.2s"
              }}
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* 데이터 로딩 중 */}
      {Object.keys(indicators).length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: TEXT_HINT }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>데이터 로딩 중...</div>
          <div style={{ fontSize: 10, color: TEXT_HINT }}>봇 가동 후 최대 5분 내에 첫 지표가 생성됩니다.</div>
        </div>
      )}

      {data && (
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 현재가 & 국면 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 4 }}>현재 국면</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: isRange ? TEXT_MUT : BLUE_LT }}>
                  {isRange ? "📉 RANGE" : "📊 TREND"}
                </div>
                <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>
                  {isRange ? "Z-Score 전략 활성" : "HMA 크로스 전략 활성"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: TEXT_HINT }}>현재가</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 800, color: SYM_COLORS[sym] }}>
                  ${data.close?.toLocaleString() ?? "--"}
                </div>
              </div>
            </div>
          </div>

          {/* 지표 카드들 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px" }}>기술적 지표</div>
            
            {/* CI 바 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: TEXT_HINT }}>CI (Choppiness)</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: data.ci < 38.2 ? GREEN : AMBER }}>
                  {data.ci?.toFixed(1) ?? "--"}
                </span>
              </div>
              <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
                <div style={{ 
                  width: `${Math.min(data.ci ?? 0, 100)}%`, 
                  height: 4, background: data.ci < 38.2 ? GREEN : AMBER, 
                  borderRadius: 2, transition: "width 0.5s" 
                }}/>
              </div>
              <div style={{ fontSize: 8, color: TEXT_HINT, marginTop: 3 }}>
                {data.ci < 38.2 ? "📈 TREND" : "↔ RANGE"}
              </div>
            </div>

            {/* Z-Score 바 */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: TEXT_HINT }}>Z-Score</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: Math.abs(data.z_score ?? 0) >= 2 ? RED : GREEN }}>
                  {data.z_score?.toFixed(2) ?? "--"}
                </span>
              </div>
              <div style={{ height: 4, background: BORDER, borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: 4, background: TEXT_HINT }}/>
                <div style={{ 
                  width: `${Math.min(Math.abs((data.z_score ?? 0) + 3) / 6 * 100, 100)}%`, 
                  height: 4, background: Math.abs(data.z_score ?? 0) >= 2 ? RED : GREEN, 
                  borderRadius: 2, transition: "width 0.5s" 
                }}/>
              </div>
              <div style={{ fontSize: 8, color: TEXT_HINT, marginTop: 3 }}>
                {data.z_score > 2 ? "과매수" : data.z_score < -2 ? "과매도" : "중립"}
              </div>
            </div>

            {/* HMA */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: TEXT_HINT }}>HMA (21)</span>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: TEXT_PRI }}>
                ${data.hma?.toLocaleString() ?? "--"}
              </span>
            </div>
          </div>

          {/* 시그널 해석 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 14 }}>시그널 해석</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  label: "CI 해석",
                  value: data.ci < 38.2 ? "강한 추세 진행 중" : data.ci < 50 ? "추세 약화 중" : "횡보/혼조 구간",
                  color: data.ci < 38.2 ? GREEN : data.ci < 50 ? AMBER : RED
                },
                {
                  label: "Z-Score 해석",
                  value: data.z_score > 2 ? "과매수 — 하락 가능성" : data.z_score < -2 ? "과매도 — 상승 가능성" : "정상 범위",
                  color: Math.abs(data.z_score) > 2 ? RED : GREEN
                },
                {
                  label: "HMA 대비",
                  value: data.close > data.hma ? "현재가 HMA 위 (강세)" : "현재가 HMA 아래 (약세)",
                  color: data.close > data.hma ? GREEN : RED
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: TEXT_MUT }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{value || "--"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 전체 심볼 요약 */}
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 14 }}>전체 요약</div>
            {SYMBOLS.map(s => {
              const i = indicators[SYM_MAP[s]]
              const isTrend = i?.regime === "TREND"
              return (
                <div key={s} onClick={() => setSym(s)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${BORDER}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: SYM_COLORS[s] }}>{s}</span>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: TEXT_MUT }}>CI: {i?.ci?.toFixed(1) ?? "--"}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUT }}>Z: {i?.z_score?.toFixed(2) ?? "--"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isTrend ? GREEN : AMBER }}>{i?.regime ?? "--"}</span>
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
