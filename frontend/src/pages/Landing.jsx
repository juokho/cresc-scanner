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

function ServiceCard({ 
  icon, 
  title, 
  subtitle, 
  description, 
  features, 
  buttonText, 
  onClick,
  isActive 
}) {
  return (
    <div 
      onClick={onClick}
      style={{
        flex: 1,
        background: isActive ? `${BLUE}15` : SURFACE,
        border: `0.5px solid ${isActive ? BLUE : BORDER}`,
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        position: "relative"
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute",
          top: -10,
          right: 20,
          background: BLUE,
          color: "#fff",
          fontSize: 10,
          padding: "4px 12px",
          borderRadius: 20,
          letterSpacing: "1px",
          fontFamily: "'Orbitron', sans-serif"
        }}>
          SELECTED
        </div>
      )}
      
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: 20, 
          fontWeight: 700, 
          color: TEXT_PRI,
          marginBottom: 4 
        }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: BLUE_LT, fontWeight: 600 }}>
          {subtitle}
        </div>
      </div>
      
      <div style={{ 
        fontSize: 12, 
        color: TEXT_MUT, 
        lineHeight: 1.6, 
        textAlign: "center",
        marginBottom: 20 
      }}>
        {description}
      </div>
      
      <div style={{ marginBottom: 20 }}>
        {features.map((feature, index) => (
          <div key={index} style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            marginBottom: 8 
          }}>
            <div style={{ 
              width: 4, 
              height: 4, 
              borderRadius: "50%", 
              background: BLUE_LT 
            }} />
            <span style={{ fontSize: 11, color: TEXT_MUT }}>{feature}</span>
          </div>
        ))}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        style={{
          width: "100%",
          padding: "12px",
          background: isActive ? BLUE : "transparent",
          border: `0.5px solid ${isActive ? BLUE : BORDER}`,
          borderRadius: 10,
          color: isActive ? "#fff" : TEXT_PRI,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1px",
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "'Orbitron', sans-serif"
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={{
      flex: 1,
      background: SURFACE,
      border: `0.5px solid ${BORDER}`,
      borderRadius: 12,
      padding: "16px 12px",
      textAlign: "center"
    }}>
      <div style={{ 
        fontFamily: "'Orbitron', sans-serif", 
        fontSize: 18, 
        fontWeight: 700, 
        color: BLUE_LT 
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Landing() {
  const [selectedService, setSelectedService] = useState(null)
  const navigate = useNavigate()

  const services = [
    {
      id: "scanner",
      icon: "📈",
      title: "미국 주식",
      subtitle: "ETF 스캐너",
      description: "실시간 시그널로 미국 3X ETF 투자 기회를 포착하세요. 양방향 시그널로 상승/하락장 모두 수익 창출",
      features: [
        "60+ 개 레버리지 ETF 실시간 모니터링",
        "LONG/SHORT/WAIT 양방향 시그널",
        "CI + Z-Score 기반 정확도",
        "디스코드 실시간 알림",
        "무료 시그널 조회"
      ],
      buttonText: "스캐너 시작하기",
      url: "/scan" // Scanner 경로
    },
    {
      id: "trading",
      icon: "₿",
      title: "코인 선물",
      subtitle: "자동매매 봇",
      description: "AI 기반 바이낸스 선물 자동매매. 24시간 시장 분석으로 최적의 진입/청산 타이밍 실행",
      features: [
        "바이낸스 선물 시장 연동",
        "AI 기반 시장 분석",
        "자동 손절/익절 실행",
        "레버리지 1x-125x 설정",
        "실시간 포지션 관리"
      ],
      buttonText: "자동매매 시작하기",
      url: "/trade" // 자동매매 경로
    }
  ]

  const handleServiceSelect = (service) => {
    setSelectedService(service.id)
    setTimeout(() => {
      navigate(service.url)
    }, 300)
  }

  return (
    <div style={{ 
      background: BG, 
      minHeight: "100vh", 
      fontFamily: "'DM Sans', sans-serif", 
      color: TEXT_PRI
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "20px 18px",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        background: BG,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoIcon size={32} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>
          </span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* 히어로 섹션 */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
            스마트 투자의 새로운 기준
          </div>
          <div style={{ fontSize: 16, color: TEXT_MUT, lineHeight: 1.6, marginBottom: 32 }}>
            QUANTER는 데이터 기반의 투자 솔루션을 제공합니다<br/>
            미국 주식부터 코인 선물까지, AI 기반 분석으로 투자 수익률을 극대화하세요
          </div>
          
          {/* 통계 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <StatCard value="10,000+" label="사용자" />
            <StatCard value="99.9%" label="가동률" />
            <StatCard value="24/7" label="실시간" />
          </div>
        </div>

        {/* 서비스 선택 */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ 
            textAlign: "center", 
            fontSize: 20, 
            fontWeight: 700, 
            marginBottom: 12,
            letterSpacing: "1px"
          }}>
            투자 자산 선택
          </div>
          <div style={{ 
            textAlign: "center", 
            fontSize: 13, 
            color: TEXT_MUT, 
            marginBottom: 32,
            lineHeight: 1.6
          }}>
            원하는 투자 자산을 선택하고 전문화된 서비스를 이용하세요
          </div>
          
          <div style={{ display: "flex", gap: 20 }}>
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

        {/* 특징 섹션 */}
        <div style={{ 
          background: SURFACE, 
          border: `0.5px solid ${BORDER}`, 
          borderRadius: 16, 
          padding: "32px 24px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            왜 QUANTER인가요?
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
            {[
              { icon: "🤖", title: "AI 기반 분석", desc: "머신러닝으로 시장 패턴 분석" },
              { icon: "⚡", title: "실시간 실행", desc: "0.1초 내 신속한 거래 실행" },
              { icon: "🛡️", title: "리스크 관리", desc: "철저한 손절/익절 전략" }
            ].map((feature, index) => (
              <div key={index} style={{ flex: 1 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{feature.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {feature.title}
                </div>
                <div style={{ fontSize: 11, color: TEXT_MUT, lineHeight: 1.5 }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ 
          textAlign: "center", 
          marginTop: 60, 
          fontSize: 11, 
          color: TEXT_HINT, 
          lineHeight: 1.6 
        }}>
          모든 투자 결정과 손실은 사용자 본인의 책임입니다<br/>
          QUANTER는 투자 참고용 정보만 제공합니다
        </div>
      </div>
    </div>
  )
}
