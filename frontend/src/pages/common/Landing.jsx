import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import { useGlobalLoading } from "../../App"
import { 
  BLUE, BLUE_LT, BG, SURFACE, BORDER, 
  TEXT_PRI, TEXT_MUT, TEXT_HINT, SILVER 
} from '../../theme'

// 로고 컴포넌트
function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { showLoading, hideLoading } = useGlobalLoading()
  const [hoveredCard, setHoveredCard] = useState(null)

  const handleServiceSelect = async (path, serviceName) => {
    showLoading(`QUANTER ENGINE ${serviceName} SCANNING...`)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setTimeout(() => {
        if (session) navigate(path)
        else navigate("/login", { state: { from: path } })
        hideLoading()
      }, 800)
    } catch (e) {
      hideLoading()
      navigate("/login")
    }
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT_PRI, fontFamily: "'Inter', sans-serif" }}>
      
      {/* --- HERO SECTION --- */}
      <div style={{ 
        padding: "50px 24px 30px", 
        textAlign: "center",
        background: `radial-gradient(circle at center, ${BLUE}12 0%, ${BG} 70%)` 
      }}>
        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <LogoIcon size={30} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 900, letterSpacing: "1.2px" }}>
            QUANTER
          </span>
        </div>
        
        <h1 style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: "36px", 
          fontWeight: 900, 
          lineHeight: 1,
          marginBottom: "32px",
          color: BLUE_LT,
          textShadow: `0 0 25px ${BLUE}AA`,
        }}>
         " Beyond Tracing"
        </h1>

        <p style={{ fontSize: "13px", color: SILVER, lineHeight: 1.5, maxWidth: "260px", margin: "0 auto 24px" }}>
          차트 앞에서 밤새지 마세요.<br/>
          QUANTER 엔진이 시장을 실시간 스캔하여<br/>
          <span style={{ color: TEXT_PRI, fontWeight: 700 }}>승률 높은 타점</span>만 골라냅니다.
        </p>

        {/* 성능 지표 (더 작고 깔끔하게) */}
        <div style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 10, 
          padding: "8px 16px", 
          borderRadius: "16px", 
          background: SURFACE, 
          border: `0.5px solid ${BORDER}` 
        }}>
          {[
            { label: "승률", value: "74.29%" },
            { label: "MDD", value: "-2.17%" },
            { label: "손익비", value: "2.067" }
          ].map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: TEXT_MUT, marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: BLUE, fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>{item.value}</div>
              </div>
              {idx < 2 && <div style={{ width: 1, height: 12, background: BORDER }} />}
            </div>
          ))}
        </div>
      </div>

      {/* --- SERVICE CARDS (대시보드 스타일로 대폭 축소) --- */}
      <div style={{ 
        padding: "0 24px 40px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 10,
        maxWidth: "400px", // 카드 전체 너비 제한
        margin: "0 auto" 
      }}>
        <h2 style={{ fontSize: "10px", color: TEXT_HINT, fontWeight: 800, letterSpacing: "2px", marginBottom: 2, textAlign: "center" }}>
          SELECT ASSET
        </h2>

        {/* 미국 주식 카드 */}
        <div 
          onClick={() => handleServiceSelect("/stock", "미국 주식")}
          onMouseEnter={() => setHoveredCard('stock')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            ...cardStyle,
            border: hoveredCard === 'stock' ? `1.5px solid ${BLUE_LT}` : `0.5px solid ${BORDER}`,
            boxShadow: hoveredCard === 'stock' ? `0 0 15px ${BLUE}66` : 'none',
          }}
        >
          <div style={iconBoxStyle}>🇺🇸</div>
          <div style={{ flex: 1 }}>
            <div style={cardTitleStyle}>미국주식 스캐너</div>
            <div style={cardDescStyle}>시그널 포착 및 디스코드 알림</div>
          </div>
          <div style={arrowStyle}>→</div>
        </div>

        {/* 비트코인 카드 */}
        <div 
          onClick={() => handleServiceSelect("/crypto", "비트코인")}
          onMouseEnter={() => setHoveredCard('crypto')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            ...cardStyle,
            border: hoveredCard === 'crypto' ? `1.5px solid ${BLUE_LT}` : `0.5px solid ${BLUE}22`,
            boxShadow: hoveredCard === 'crypto' ? `0 0 15px ${BLUE}66` : 'none',
          }}
        >
          <div style={{ ...iconBoxStyle, background: `${BLUE}15` }}>₿</div>
          <div style={{ flex: 1 }}>
            <div style={cardTitleStyle}>코인 선물 자동매매 봇</div>
            <div style={cardDescStyle}>QUANTER 엔진 기반 24시간 자동 매매</div>
          </div>
          <div style={arrowStyle}>→</div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div style={{ textAlign: "center", padding: "20px 40px 60px", opacity: 0.4 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: "10px", fontWeight: 700, color: SILVER, fontFamily: "'Orbitron', sans-serif" }}>
          <span>QUANTER ENGINE</span>
        </div>
      </div>
    </div>
  )
}

// 스타일 객체 (Home.jsx 카드 사이즈와 동기화)
const cardStyle = {
  background: SURFACE,
  padding: "12px 16px", // 16px -> 12px로 더 줄여 대시보드 느낌 강조
  borderRadius: "12px", // 16px -> 12px로 샤프하게
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  transition: "all 0.2s ease-out"
}

const iconBoxStyle = {
  width: "36px",  // 40px -> 36px
  height: "36px", // 40px -> 36px
  background: BORDER,
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px"
}

const cardTitleStyle = {
  fontSize: "13px", // 14px -> 13px
  fontWeight: 700,
  marginBottom: "1px",
  color: TEXT_PRI
}

const cardDescStyle = {
  fontSize: "10.5px",
  color: SILVER,
  lineHeight: 1.3
}

const arrowStyle = {
  fontSize: "14px",
  color: TEXT_HINT
}