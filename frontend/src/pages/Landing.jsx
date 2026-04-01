import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED } from '../theme'

function LogoIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

function ServiceCard({ icon, title, subtitle, description, features, buttonText, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        background: isActive ? `${BLUE}18` : SURFACE,
        border: `1px solid ${isActive ? BLUE : BORDER}`,
        borderRadius: 20,
        padding: "28px 24px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        position: "relative",
        boxShadow: isActive ? `0 0 24px ${BLUE}30` : "none"
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", top: -11, right: 20,
          background: BLUE, color: "#fff",
          fontSize: 9, padding: "4px 12px",
          borderRadius: 20, letterSpacing: "1.5px",
          fontFamily: "'Orbitron', sans-serif"
        }}>SELECTED</div>
      )}

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>
          {icon === "chart" ? "📊" : "⚡"}
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: TEXT_PRI, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: BLUE_LT, fontWeight: 600, letterSpacing: "0.5px" }}>
          {subtitle}
        </div>
      </div>

      <div style={{ fontSize: 12, color: TEXT_MUT, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>
        {description}
      </div>

      <div style={{ marginBottom: 24 }}>
        {features.map((feature, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: BLUE_LT, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: TEXT_MUT }}>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={{
          width: "100%", padding: "13px",
          background: isActive ? BLUE : "transparent",
          border: `1px solid ${isActive ? BLUE : BORDER}`,
          borderRadius: 10, color: isActive ? "#fff" : TEXT_PRI,
          fontSize: 11, fontWeight: 700, letterSpacing: "1px",
          cursor: "pointer", transition: "all 0.2s",
          fontFamily: "'Orbitron', sans-serif"
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default function Landing() {
  const [selectedService, setSelectedService] = useState(null)
  const navigate = useNavigate()

  const services = [
    {
      id: "scanner",
      icon: "chart",
      title: "미국 주식",
      subtitle: "ETF 스캐너",
      description: "실시간 시그널로 미국 3X ETF 투자 기회를 포착하세요. 상승장도 하락장도 양방향 수익 가능",
      features: [
        "60+ 레버리지 ETF 실시간 모니터링",
        "LONG / SHORT 양방향 시그널",
        "CI + Z-Score 기반 고정밀 분석",
        "디스코드 실시간 알림",
        "무료로 시작 가능"
      ],
      buttonText: "스캐너 시작하기",
      url: "/stock"
    },
    {
      id: "trading",
      icon: "bot",
      title: "코인 선물",
      subtitle: "자동매매 봇",
      description: "바이낸스 선물 자동매매. 24시간 시장을 분석하고 진입·청산을 자동으로 실행합니다",
      features: [
        "바이낸스 선물 시장 연동",
        "자동 손절 / 익절 실행",
        "레버리지 1x – 125x 설정",
        "실시간 포지션 모니터링",
        "다중 심볼 동시 운용"
      ],
      buttonText: "자동매매 시작하기",
      url: "/crypto"
    }
  ]

  const handleServiceSelect = async (service) => {
    setSelectedService(service.id)
    const { supabase } = await import("../supabase")
    const { data: { session } } = await supabase.auth.getSession()
    setTimeout(() => {
      if (session) {
        navigate(service.url)
      } else {
        navigate("/login", { state: { from: service.url } })
      }
    }, 300)
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI }}>

      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky", top: 0, background: BG, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={28} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: BLUE_LT }}>
            QUANTER
          </span>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "transparent", border: `0.5px solid ${BORDER}`,
            borderRadius: 8, padding: "7px 16px",
            color: TEXT_MUT, fontSize: 11, cursor: "pointer"
          }}
        >
          로그인
        </button>
      </div>

      <div style={{ padding: "48px 24px 80px", maxWidth: 480, margin: "0 auto" }}>

        {/* 히어로 */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>

          {/* 태그라인 */}
          <div style={{
            display: "inline-block",
            background: `${BLUE}18`, border: `0.5px solid ${BLUE}50`,
            borderRadius: 20, padding: "5px 14px",
            fontSize: 10, color: BLUE_LT, letterSpacing: "1.5px",
            fontWeight: 600, marginBottom: 24
          }}>
            AI-POWERED INVESTMENT
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.35, marginBottom: 20 }}>
            시간 쏟지 마세요<br/>
            <span style={{ color: BLUE_LT }}>투자는 AI에게</span>
          </div>

          <div style={{ fontSize: 14, color: TEXT_MUT, lineHeight: 1.9, marginBottom: 32 }}>
            본업에 집중하세요. 가족과 함께하세요.<br/>
            시장 분석과 매매는 QUANTER가 대신합니다.<br/>
            <span style={{ color: TEXT_PRI, fontWeight: 500 }}>일상으로의 복귀, 그게 진짜 수익입니다.</span>
          </div>

          {/* 한 줄 통계 */}
          <div style={{ display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", border: `0.5px solid ${BORDER}` }}>
            {[
              { value: "24/7", label: "무중단 운용" },
              { value: "60+", label: "ETF 모니터링" },
              { value: "자동", label: "진입·청산" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: "16px 8px", textAlign: "center",
                background: SURFACE,
                borderRight: i < 2 ? `0.5px solid ${BORDER}` : "none"
              }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: BLUE_LT }}>{s.value}</div>
                <div style={{ fontSize: 9, color: TEXT_HINT, marginTop: 3, letterSpacing: "0.3px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 일상 복귀 포인트 3가지 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: TEXT_HINT, letterSpacing: "1.5px", fontWeight: 600, marginBottom: 20, textAlign: "center" }}>
            QUANTER를 쓰는 이유
          </div>
          {[
            { icon: "💼", title: "본업에 집중", desc: "시장을 볼 시간에 더 중요한 일을 하세요. 매매 타이밍은 AI가 잡습니다." },
            { icon: "👨‍👩‍👧", title: "가족과 함께", desc: "차트 대신 가족을 보세요. 포지션 관리는 봇이 24시간 대신합니다." },
            { icon: "😌", title: "감정 없는 매매", desc: "공포와 탐욕 없이, 데이터와 로직으로만 움직이는 투자를 경험하세요." },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              padding: "18px 0",
              borderBottom: i < 2 ? `0.5px solid ${BORDER}` : "none"
            }}>
              <div style={{ fontSize: 28, flexShrink: 0, width: 40, textAlign: "center" }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: TEXT_MUT, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 서비스 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: TEXT_HINT, letterSpacing: "1.5px", fontWeight: 600, marginBottom: 20, textAlign: "center" }}>
            서비스 선택
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {services.map(service => (
              <ServiceCard
                key={service.id}
                {...service}
                isActive={selectedService === service.id}
                onClick={() => handleServiceSelect(service)}
              />
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 10, color: TEXT_HINT, lineHeight: 1.8 }}>
          모든 투자 결정과 손실은 사용자 본인의 책임입니다<br/>
          QUANTER는 투자 참고용 정보만 제공합니다
        </div>
      </div>
    </div>
  )
}
