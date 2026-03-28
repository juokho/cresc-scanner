import { useState, useCallback, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { NavBar } from "./Home"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

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

// 스켈레톤 UI 컴포넌트
function SkeletonCard({ height = 60 }) {
  return (
    <div style={{ 
      background: SURFACE, 
      border: `0.5px solid ${BORDER}`, 
      borderRadius: 12, 
      padding: "12px 14px",
      height: height,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(90deg, transparent, ${BORDER}40, transparent)`,
        animation: "skeleton-loading 1.5s infinite"
      }}/>
      <div style={{ opacity: 0.1 }}>
        <div style={{ width: "60%", height: 12, background: TEXT_MUT, borderRadius: 4, marginBottom: 8 }}/>
        <div style={{ width: "40%", height: 8, background: TEXT_MUT, borderRadius: 4 }}/>
      </div>
    </div>
  )
}

function StatCard({ value, label, color = TEXT_PRI }) {
  return (
    <div style={{
      flex: 1, 
      background: SURFACE,
      border: `0.5px solid ${BORDER}`,
      borderRadius: 8, 
      padding: "12px 8px", 
      textAlign: "center"
    }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Field({ label, type, placeholder, value, onChange, min, max, step = 1 }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 6, letterSpacing: "1px" }}>
        {label}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        min={min}
        max={max}
        step={step}
        style={{
          width: "100%", 
          background: BG,
          border: `0.5px solid ${focused ? BLUE_LT : BORDER}`,
          borderRadius: 10, 
          padding: "12px 14px",
          fontSize: 14, 
          color: TEXT_PRI,
          fontFamily: "'DM Sans', sans-serif",
          outline: "none", 
          boxSizing: "border-box",
          transition: "border-color 0.2s"
        }}
      />
    </div>
  )
}

function PrimaryBtn({ label, onClick, loading, disabled = false, color = BLUE }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%", 
        background: loading ? "#2a3a8a" : (disabled ? BORDER : color),
        border: "none", 
        borderRadius: 10, 
        padding: 14,
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 11, 
        fontWeight: 700, 
        color: disabled ? TEXT_HINT : "#fff",
        letterSpacing: "2px", 
        cursor: (loading || disabled) ? "not-allowed" : "pointer",
        transition: "background 0.2s"
      }}
    >
      {loading ? "처리 중..." : label}
    </button>
  )
}

export default function Trade() {
  const navigate = useNavigate()
  const [leverage, setLeverage] = useState(50)
  const [tradePct, setTradePct] = useState(5)
  const [slRoi, setSlRoi] = useState(1.5)
  const [tpRoi, setTpRoi] = useState(3.5)
  const [botRunning, setBotRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  // API Key 모달
  const ApiKeyModal = () => {
    const [key, setKey] = useState("")
    const [focused, setFocused] = useState(false)

    return (
      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex: 100, padding: 20,
      }}>
        <div style={{
          background: SURFACE, border:`0.5px solid ${BORDER}`,
          borderRadius: 16, padding:"24px 20px", width:"100%", maxWidth: 360,
        }}>
          <div style={{ fontSize:15, fontWeight:600, color: TEXT_PRI, marginBottom: 8 }}>바이낸스 API Key 입력</div>
          <div style={{ fontSize:12, color: TEXT_MUT, lineHeight:1.6, marginBottom:20 }}>
            바이낸스 API Key와 Secret을 입력하세요.<br/>
            <span style={{ color: BLUE_LT }}>API 권한: 선물 거래</span>
          </div>
          <input
            type="password"
            placeholder="API Key"
            value={key}
            onChange={e => setKey(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width:"100%", background: BG,
              border:`0.5px solid ${focused ? BLUE_LT : BORDER}`,
              borderRadius: 10, padding:"12px 14px",
              fontSize:13, color: TEXT_PRI,
              fontFamily:"'DM Sans', sans-serif",
              outline:"none", boxSizing:"border-box",
              marginBottom: 12, transition:"border-color .2s",
            }}
          />
          <input
            type="password"
            placeholder="Secret Key"
            style={{
              width:"100%", background: BG,
              border:`0.5px solid ${BORDER}`,
              borderRadius: 10, padding:"12px 14px",
              fontSize:13, color: TEXT_PRI,
              fontFamily:"'DM Sans', sans-serif",
              outline:"none", boxSizing:"border-box",
              marginBottom: 16, transition:"border-color .2s",
            }}
          />
          <div style={{ display:"flex", gap: 8 }}>
            <button
              onClick={() => setShowApiKeyModal(false)}
              style={{
                flex:1, padding: 12, background:"transparent",
                border:`0.5px solid ${BORDER}`, borderRadius: 10,
                color: TEXT_MUT, fontSize:12, cursor:"pointer",
              }}
            >취소</button>
            <button
              onClick={() => {
                if (key.trim()) {
                  setApiKey(key.trim())
                  setShowApiKeyModal(false)
                }
              }}
              disabled={!key.trim()}
              style={{
                flex:2, padding: 12,
                background: key.trim() ? BLUE : BORDER,
                border:"none", borderRadius: 10,
                color:"#fff", fontSize:12,
                fontFamily:"'Orbitron', sans-serif",
                letterSpacing:"1px", cursor: key.trim() ? "pointer" : "not-allowed",
                transition:"background .2s",
              }}
            >확인</button>
          </div>
        </div>
      </div>
    )
  }

  const handleStartBot = async () => {
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setLoading(true)
    try {
      // TODO: 실제 API 연동
      console.log("봇 시작:", { leverage, tradePct, slRoi, tpRoi, apiKey })
      setBotRunning(true)
    } catch (error) {
      console.error("봇 시작 실패:", error)
    }
    setLoading(false)
  }

  const handleStopBot = async () => {
    setLoading(true)
    try {
      // TODO: 실제 API 연동
      console.log("봇 중지")
      setBotRunning(false)
    } catch (error) {
      console.error("봇 중지 실패:", error)
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      background: BG, 
      minHeight: "100vh", 
      fontFamily: "'DM Sans', sans-serif", 
      color: TEXT_PRI,
      paddingBottom: 100
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "14px 18px",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        background: BG,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={28} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>.TRADING
          </span>
        </div>
        
        <button
          onClick={() => navigate('/')}
          style={{
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 6,
            padding: "6px 12px",
            color: TEXT_MUT,
            fontSize: 11,
            cursor: "pointer"
          }}
        >
          ← 홈
        </button>
      </div>

      {/* 컨텐츠 */}
      <div style={{ padding: "20px 18px", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            코인 선물 자동매매
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUT, lineHeight: 1.6 }}>
            AI 기반 바이낸스 선물 시장 자동매매 봇
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <StatCard value="BTC/ETH/SOL" label="지원 종목" />
          <StatCard value="24/7" label="운영 시간" />
          <StatCard value="75x" label="최대 레버리지" />
        </div>

        {/* 봇 상태 */}
        <div style={{
          background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          borderRadius: 12,
          padding: "16px",
          marginBottom: 20
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: TEXT_MUT }}>봇 상태</span>
            <span style={{
              fontSize: 10,
              padding: "4px 8px",
              borderRadius: 4,
              background: botRunning ? `${GREEN}22` : `${TEXT_MUT}22`,
              color: botRunning ? GREEN : TEXT_MUT,
              fontWeight: 700
            }}>
              {botRunning ? "실행 중" : "정지"}
            </span>
          </div>
          {apiKey && (
            <div style={{ marginTop: 8, fontSize: 10, color: GREEN }}>
              ✓ API Key 등록됨
            </div>
          )}
        </div>

        {/* 설정 */}
        <div style={{
          background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          borderRadius: 12,
          padding: "16px",
          marginBottom: 20
        }}>
          <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 16, fontWeight: 600 }}>
            봇 설정
          </div>
          
          <Field 
            label="레버리지" 
            type="number" 
            placeholder="50" 
            value={leverage} 
            onChange={setLeverage}
            min={1}
            max={125}
          />
          
          <Field 
            label="진입 비율 (%)" 
            type="number" 
            placeholder="5" 
            value={tradePct} 
            onChange={setTradePct}
            min={1}
            max={100}
          />

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field 
                label="손절 배수" 
                type="number" 
                placeholder="1.5" 
                value={slRoi} 
                onChange={setSlRoi}
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field 
                label="익절 배수" 
                type="number" 
                placeholder="3.5" 
                value={tpRoi} 
                onChange={setTpRoi}
                min={0.1}
                max={20}
                step={0.1}
              />
            </div>
          </div>
        </div>

        {/* 제어 버튼 */}
        <PrimaryBtn 
          label={botRunning ? "봇 중지" : "봇 시작"} 
          onClick={botRunning ? handleStopBot : handleStartBot}
          loading={loading}
          color={botRunning ? RED : BLUE}
        />

        {/* API Key 설정 */}
        <button
          onClick={() => setShowApiKeyModal(true)}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 8,
            color: TEXT_MUT,
            fontSize: 11,
            cursor: "pointer",
            marginTop: 12
          }}
        >
          {apiKey ? "API Key 변경" : "API Key 설정"}
        </button>

        {/* 안내 */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: TEXT_HINT, lineHeight: 1.6 }}>
          자동매매는 투자 참고용이며 모든 투자 결정과<br/>손실은 사용자 본인의 책임입니다
        </div>
      </div>

      {/* API Key 모달 */}
      {showApiKeyModal && <ApiKeyModal />}

      <NavBar navigate={navigate} active="trade" />
    </div>
  )
}
