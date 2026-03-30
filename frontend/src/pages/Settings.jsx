import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { checkServerStatus, updateBotSettings, saveApiKey } from "../api"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

// [원본 스타일 유지] 슬라이더 컴포넌트
function SliderRow({ label, desc, value, min, max, color, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: TEXT_PRI, fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color }}>
          {value}<span style={{ fontSize: 11, color: TEXT_MUT }}>{unit}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", width: "100%", height: 3, background: BORDER, borderRadius: 2 }} />
        <div style={{ position: "absolute", width: `${pct}%`, height: 3, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}60` }} />
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            WebkitAppearance: "none", width: "100%", background: "transparent", zIndex: 2, cursor: "pointer", outline: "none"
          }}
        />
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  
  // [원본 로직 유지] 상태 값들
  const [leverage, setLeverage] = useState(20)
  const [size, setSize] = useState(10)
  const [sl, setSl] = useState(2.0)
  const [tp, setTp] = useState(5.0)
  const [slMode, setSlMode] = useState("atr") 
  
  // [새로 추가] API 상태 값
  const [apiKey, setApiKeyInput] = useState("")
  const [apiSecret, setApiSecretInput] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [serverOnline, setServerOnline] = useState(false)

  useEffect(() => {
    checkServerStatus().then(setServerOnline)
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      // 1. API 키가 입력되었다면 저장
      if (apiKey.trim() && apiSecret.trim()) {
        await saveApiKey(apiKey, apiSecret)
      }

      // 2. 봇 설정 업데이트
      await updateBotSettings({
        leverage,
        trade_pct: size / 100,
        sl_atr_mult: sl,
        tp_atr_mult: tp,
        sl_mode: slMode,
        is_order_enabled: true
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
      alert("저장 실패")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT_PRI, padding: "20px 20px 100px" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "1px" }}>BOT SETTINGS</h2>
          <div style={{ fontSize: 10, color: serverOnline ? GREEN : RED, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: serverOnline ? GREEN : RED, boxShadow: serverOnline ? `0 0 5px ${GREEN}` : "none" }} />
            TRADING SERVER {serverOnline ? "CONNECTED" : "DISCONNECTED"}
          </div>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: "transparent", border: `0.5px solid ${BORDER}`, color: TEXT_MUT, padding: "6px 12px", borderRadius: 8, fontSize: 11 }}>BACK</button>
      </div>

      {/* [새로 추가] API 설정 섹션 - 원본 디자인 톤에 맞춤 */}
      <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: BLUE, letterSpacing: "2px", fontWeight: 800, marginBottom: 20 }}>API CONNECTION</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div>
            <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, marginLeft: 4 }}>BINANCE API KEY</div>
            <input 
              type="password" value={apiKey} onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Ex: 4vK... (Optional if already set)"
              style={{ width: "100%", background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "12px", color: TEXT_PRI, fontSize: 11, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, marginLeft: 4 }}>BINANCE SECRET KEY</div>
            <input 
              type="password" value={apiSecret} onChange={e => setApiSecretInput(e.target.value)}
              placeholder="Ex: 9sA... (Optional if already set)"
              style={{ width: "100%", background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "12px", color: TEXT_PRI, fontSize: 11, boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* 전략 설정 섹션 */}
      <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: BLUE, letterSpacing: "2px", fontWeight: 800, marginBottom: 25 }}>TRADING STRATEGY</div>
        
        <SliderRow label="LEVERAGE" desc="교차 레버리지 배수" value={leverage} min={1} max={50} unit="x" color={BLUE} onChange={setLeverage} />
        <SliderRow label="ENTRY SIZE" desc="잔고 대비 진입 비중" value={size} min={1} max={100} unit="%" color={BLUE} onChange={setSize} />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <SliderRow label="TAKE PROFIT" desc="익절 (ATR)" value={tp} min={1} max={10} unit="x" color={GREEN} onChange={setTp} />
          <SliderRow label="STOP LOSS" desc="손절 (ATR)" value={sl} min={0.5} max={5} unit="x" color={RED} onChange={setSl} />
        </div>

        {/* 손절 방식 선택 */}
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          {["atr", "trailing"].map(mode => (
            <div 
              key={mode}
              onClick={() => setSlMode(mode)}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, textAlign: "center", fontSize: 11, cursor: "pointer",
                background: slMode === mode ? `${BLUE}20` : BG,
                border: `0.5px solid ${slMode === mode ? BLUE : BORDER}`,
                color: slMode === mode ? BLUE : TEXT_MUT,
                transition: "all 0.2s"
              }}
            >
              {mode === "atr" ? "FIXED ROI" : "TRAILING"}
            </div>
          ))}
        </div>
      </div>

      {/* 요약 섹션 */}
      <div style={{ background: `${SURFACE}80`, borderRadius: 16, padding: 20, marginBottom: 24, border: `0.5px solid ${BORDER}` }}>
        <div style={{ fontSize: 10, color: TEXT_HINT, letterSpacing: "1px", marginBottom: 15 }}>CONFIG SUMMARY</div>
        {[
          { label: "레버리지", value: `${leverage}x` },
          { label: "진입 사이즈", value: `${size}%` },
          { label: "손절 방식", value: slMode === "trailing" ? "트레일링" : "ATR 고정" }
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: TEXT_MUT }}>{item.label}</span>
            <span style={{ color: TEXT_PRI, fontFamily: "'Orbitron', sans-serif" }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={loading || saved}
        style={{
          width: "100%", height: 56, borderRadius: 14, border: "none",
          background: saved ? GREEN : loading ? `${BLUE}80` : BLUE,
          color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Orbitron', sans-serif",
          letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s"
        }}
      >
        {saved ? "SUCCESS" : loading ? "SAVING..." : "SAVE & START BOT"}
      </button>
    </div>
  )
}