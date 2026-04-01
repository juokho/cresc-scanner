import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { checkServerStatus, updateBotSettings } from "../api"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

function SliderRow({ label, desc, value, min, max, color, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: TEXT_PRI, fontWeight: 500, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
        </div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 18, fontWeight: 700, color
        }}>
          {value}<span style={{ fontSize: 11, color: TEXT_MUT }}>{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          WebkitAppearance: "none",
          width: "100%", height: 3,
          borderRadius: 2, outline: "none",
          cursor: "pointer",
          background: `linear-gradient(to right, ${color} ${pct}%, #1c2530 ${pct}%)`
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: TEXT_HINT }}>{min}{unit}</span>
        <span style={{ fontSize: 9, color: TEXT_HINT }}>{max}{unit}</span>
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [leverage, setLeverage] = useState(50)
  const [size,     setSize]     = useState(5)
  const [sl,       setSl]       = useState(15)
  const [tp,       setTp]       = useState(30)
  const [slMode,   setSlMode]   = useState("roi")
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [balance,  setBalance]  = useState(0)

  // [버그수정] 기존: 서버 현재 설정값 로드 없음 → 항상 기본값으로 초기화됨
  //           수정: 진입 시 서버 현재 설정 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        const status = await checkServerStatus()
        if (status.leverage)  setLeverage(status.leverage)
        if (status.trade_pct) setSize(Math.round(status.trade_pct * 100))
        if (status.sl_roi)    setSl(status.sl_roi)
        if (status.tp_roi)    setTp(status.tp_roi)
        if (status.sl_mode)   setSlMode(status.sl_mode)
      } catch (e) {
        console.error("설정 불러오기 실패:", e)
      }
    }
    load()
  }, [])

  // [버그수정] 기존: SAVE 버튼이 navigate("/dashboard")만 함 → 실제 API 저장 없음
  //           수정: updateBotSettings API 호출 후 이동
  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await updateBotSettings({
        leverage,
        tradePct: size,
        slRoi: sl,
        tpRoi: tp,
        slMode,
      })
      setSaved(true)
      setTimeout(() => navigate("/dashboard"), 800)
    } catch (e) {
      alert(e.message || "저장에 실패했어요")
    }
    setLoading(false)
  }

  // sl >= tp 경고
  const isRiskWarning = sl >= tp

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      color: TEXT_PRI, maxWidth: 430,
      margin: "0 auto"
    }}>

      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        <div onClick={() => navigate("/dashboard")} style={{ cursor: "pointer", padding: "4px 4px 4px 0" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>
          CONTROLS
        </span>
      </div>

      <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 24 }}>

        <SliderRow
          label="레버리지"
          desc="높을수록 수익/손실 증폭"
          value={leverage} min={1} max={125}
          color={BLUE_LT} unit="x"
          onChange={setLeverage}
        />

        <div style={{ height: "0.5px", background: BORDER }}/>

        <SliderRow
          label="진입 사이즈"
          desc={`잔고 기준 진입 비율`}
          value={size} min={1} max={100}
          color={BLUE_LT} unit="%"
          onChange={setSize}
        />

        <div style={{ height: "0.5px", background: BORDER }}/>

        <SliderRow
          label="손절 (ROI)"
          desc="이 수익률 도달 시 자동 손절"
          value={sl} min={1} max={100}
          color={RED} unit="%"
          onChange={setSl}
        />

        <div style={{ height: "0.5px", background: BORDER }}/>

        <SliderRow
          label="익절 (ROI)"
          desc="이 수익률 도달 시 자동 익절"
          value={tp} min={1} max={200}
          color={GREEN} unit="%"
          onChange={setTp}
        />

        {/* SL >= TP 경고 */}
        {isRiskWarning && (
          <div style={{
            background: "#1a0808", border: "0.5px solid #3a1010",
            borderRadius: 8, padding: "10px 14px",
            fontSize: 11, color: RED
          }}>
            ⚠️ 손절({sl}%) 값이 익절({tp}%)보다 크거나 같습니다. 설정을 확인해주세요.
          </div>
        )}

        <div style={{ height: "0.5px", background: BORDER }}/>

        {/* SL 모드 선택 */}
        <div>
          <div style={{ fontSize: 12, color: TEXT_PRI, fontWeight: 500, marginBottom: 8 }}>손절 방식</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "roi",      label: "ROI 고정",   desc: "설정 ROI 도달 시 청산" },
              { key: "trailing", label: "트레일링", desc: "고점 대비 하락 시 청산" },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                onClick={() => setSlMode(key)}
                style={{
                  flex: 1, background: slMode === key ? "#0d1420" : SURFACE,
                  border: `0.5px solid ${slMode === key ? BLUE : BORDER}`,
                  borderRadius: 10, padding: "11px 10px",
                  cursor: "pointer", textAlign: "center"
                }}
              >
                <div style={{ fontSize: 12, color: slMode === key ? BLUE_LT : TEXT_PRI, fontWeight: 500, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 요약 카드 */}
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 12, padding: "14px 16px"
        }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>SUMMARY</div>
          {[
            { label: "레버리지",  value: `${leverage}x` },
            { label: "진입 사이즈", value: `${size}%` },
            { label: "손절",      value: `-${sl}%` },
            { label: "익절",      value: `+${tp}%` },
            { label: "손절 방식", value: slMode === "trailing" ? "트레일링" : "ROI 고정" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 12, marginBottom: 6
            }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI, fontFamily: "'Orbitron', sans-serif", fontSize: 11 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={loading || saved}
          style={{
            width: "100%",
            background: saved ? "#0d3a20" : loading ? "#2a3a8a" : BLUE,
            border: saved ? "0.5px solid #22c55e" : "none",
            borderRadius: 10, padding: 14,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 11, fontWeight: 700,
            color: saved ? GREEN : "#fff",
            letterSpacing: "2px",
            cursor: loading || saved ? "not-allowed" : "pointer",
            marginBottom: 32, transition: "all .2s"
          }}
        >
          {saved ? "✓ 저장됨" : loading ? "저장 중..." : "SAVE SETTINGS"}
        </button>

      </div>
    </div>
  )
}
