import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED } from '../theme'

// [1] 세련된 포인트 컬러 상수 (Neon Blue)
const BLUE_QUANTER = "#4477FF"; // image_6.png에서 추출한 정밀 컬러

// [2] 로고 아이콘 - 브랜드 아이덴티티 유지 (색상 수정)
function LogoIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE_QUANTER}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

// [3] 커스텀 포인트 컬러 박스 아이콘 (미국 주식용 $) - 비율 및 디자인 수정
function UsaStockIcon({ size = 48, isActive }) {
  return (
    <div style={{
      width: size, height: size,
      background: isActive ? BLUE_QUANTER : `${BORDER}ee`, 
      borderRadius: 14, // 조금 더 둥글게
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.4s ease",
      boxShadow: isActive ? `0 8px 24px ${BLUE_QUANTER}60` : "0 4px 8px rgba(0,0,0,0.15)"
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M12 2V22M17 5H9.5C8.11929 5 7 6.11929 7 7.5C7 8.88071 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5C17 13.8807 15.8807 15 14.5 15H7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// [4] 커스텀 포인트 컬러 박스 아이콘 (코인용 ₿) - 찌그러짐 완전 해결 (정비율) 및 네온 글로우 추가
function CoinIcon({ size = 48, isActive }) {
  return (
    <div style={{
      width: size, height: size,
      background: isActive ? BLUE_QUANTER : `${BORDER}ee`, 
      borderRadius: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.4s ease",
      // 쫀득한 네온 글로우 효과
      boxShadow: isActive ? `0 0 30px ${BLUE_QUANTER}80, 0 8px 24px ${BLUE_QUANTER}60` : "0 4px 8px rgba(0,0,0,0.15)"
    }}>
      {/* 찌그러짐 완전 해결: 정비율 B 심볼 SVG 디자인 (상하단 획과 곡선 정밀화) */}
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 100 100" fill="white">
        <path d="M78.6,40.6c0-11-8.9-19.9-19.9-19.9H31.3V10h-13v10.7H10v13h8.3V79.3H10v13h8.3v10.7h13v-10.7h27.4c11,0,19.9-8.9,19.9-19.9C78.6,61.5,69.7,52.6,58.7,52.6C69.7,52.6,78.6,43.7,78.6,40.6z M58.7,33.7c3.8,0,6.9,3.1,6.9,6.9s-3.1,6.9-6.9,6.9H31.3v-13.8H58.7z M58.7,72.4H31.3V58.6h27.4c3.8,0,6.9,3.1,6.9,6.9C65.6,69.3,62.5,72.4,58.7,72.4z"/>
      </svg>
    </div>
  )
}

// [5] 서비스 카드 (아이콘 컴포넌트 분기 수정)
function ServiceCard({ id, title, subtitle, description, features, buttonText, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        background: isActive 
          ? `linear-gradient(145deg, ${SURFACE}, ${BLUE_QUANTER}15)` 
          : SURFACE,
        border: `1px solid ${isActive ? BLUE_QUANTER : BORDER}`,
        borderRadius: 24,
        padding: "36px 28px",
        cursor: "pointer",
        transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isActive ? "translateY(-12px) scale(1.03)" : "translateY(0)",
        position: "relative",
        boxShadow: isActive ? `0 25px 60px ${BLUE_QUANTER}40` : "0 6px 16px rgba(0,0,0,0.2)"
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", top: -14, right: 28,
          background: BLUE_QUANTER, color: "#fff",
          fontSize: 10, padding: "6px 16px",
          borderRadius: 20, letterSpacing: "2px",
          fontWeight: 900,
          fontFamily: "'Orbitron', sans-serif",
          boxShadow: `0 4px 16px ${BLUE_QUANTER}80`
        }}>SELECTED</div>
      )}

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ 
          marginBottom: 20,
          display: "flex", justifyContent: "center"
        }}>
          {id === "scanner" ? (
            <UsaStockIcon isActive={isActive} />
          ) : (
            <CoinIcon isActive={isActive} />
          )}
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: TEXT_PRI, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: BLUE_QUANTER, fontWeight: 900, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {subtitle}
        </div>
      </div>

      <div style={{ fontSize: 13.5, color: TEXT_MUT, lineHeight: 1.85, textAlign: "center", marginBottom: 28 }}>
        {description}
      </div>

      <div style={{ marginBottom: 32, background: isActive ? "rgba(255,255,255,0.04)" : "transparent", padding: "16px", borderRadius: "20px" }}>
        {features.map((feature, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? BLUE_QUANTER : `${BORDER}ee`, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: isActive ? TEXT_PRI : TEXT_MUT }}>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={{
          width: "100%", padding: "18px",
          background: isActive ? BLUE_QUANTER : "transparent",
          border: `2px solid ${isActive ? BLUE_QUANTER : BORDER}`,
          borderRadius: 14, color: isActive ? "#fff" : TEXT_PRI,
          fontSize: 12, fontWeight: 900, letterSpacing: "1px",
          cursor: "pointer", transition: "all 0.2s",
          fontFamily: "'Orbitron', sans-serif",
          boxShadow: isActive ? `0 10px 20px ${BLUE_QUANTER}50` : "none"
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}

// [6] 랜딩 메인 페이지
export default function Landing() {
  const [selectedService, setSelectedService] = useState(null)
  const navigate = useNavigate()

  // 명칭 변경 (QUANTER 브랜드 통합)
  const services = [
    {
      id: "scanner",
      title: "미국 주식",
      subtitle: "QUANTER SCANNER", // 명칭 변경
      description: "60개 이상의 레버리지 ETF를 실시간으로 스캔합니다. 데이터 기반의 정확한 진입 시점을 확보하세요.",
      features: [
        "CI + Z-Score 고정밀 알고리즘",
        "LONG / SHORT 양방향 포착",
        "디스코드 즉시 알림 전송",
        "무료 기본 티어 제공"
      ],
      buttonText: "스캐너 시작하기",
      url: "/scan"
    },
    {
      id: "trading",
      title: "코인 선물",
      subtitle: "QUANTER BOT", // 명칭 변경
      description: "감정을 배제한 24시간 자동매매 시스템. 바이낸스 거래소와 완벽하게 연동되어 구동됩니다.",
      features: [
        "바이낸스 선물 API 연동",
        "최대 125배 레버리지 지원",
        "자동 익절/손절 트레일링",
        "다중 심볼 동시 스캔"
      ],
      buttonText: "자동매매 시작하기",
      url: "/trade"
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
    }, 400)
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, overflowX: "hidden" }}>

      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px",
        borderBottom: `1px solid ${BORDER}`,
        position: "sticky", top: 0, background: `${BG}dd`, backdropFilter: "blur(12px)", zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LogoIcon size={36} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: BLUE_QUANTER, letterSpacing: "1px" }}>
            QUANTER
          </span>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "transparent", border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: "10px 24px",
            color: TEXT_PRI, fontSize: 13, fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          로그인
        </button>
      </div>

      <div style={{ padding: "80px 24px 120px", maxWidth: 560, margin: "0 auto" }}>

        {/* 히어로 섹션 */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{
            display: "inline-block",
            background: `${BLUE_QUANTER}18`, border: `1px solid ${BLUE_QUANTER}50`,
            borderRadius: 30, padding: "7px 22px",
            fontSize: 12, color: BLUE_QUANTER, letterSpacing: "2.5px",
            fontWeight: 900, marginBottom: 32,
            fontFamily: "'Orbitron', sans-serif"
          }}>
            AI-POWERED QUANT SYSTEM
          </div>

          {/* 그라데이션 색상 수정 */}
          <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.25, marginBottom: 28, letterSpacing: "-1px" }}>
            투자에 시간 쏟지 마세요<br/>
            <span style={{ 
              background: `linear-gradient(90deg, ${BLUE_QUANTER} 0%, #fff 120%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>자동 분석 & 매매 봇</span>
          </div>

          <div style={{ fontSize: 16, color: TEXT_MUT, lineHeight: 1.85, marginBottom: 48 }}>
            일상으로의 복귀가 곧 진짜 수익입니다.<br/>
            복잡한 차트 분석은 <span style={{ color: BLUE_QUANTER, fontWeight: 900 }}>QUANTER</span>가 대신하겠습니다.
          </div>

          {/* 한 줄 통계 (스타일 유지) */}
          <div style={{ display: "flex", borderRadius: 24, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 15px 40px rgba(0,0,0,0.3)" }}>
            {[
              { value: "24/7", label: "무중단 가동" },
              { value: "60+", label: "실시간 스캔" },
              { value: "AUTO", label: "매수·매도" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: "24px 14px", textAlign: "center",
                background: SURFACE,
                borderRight: i < 2 ? `1px solid ${BORDER}` : "none"
              }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 800, color: BLUE_QUANTER }}>{s.value}</div>
                <div style={{ fontSize: 11, color: TEXT_HINT, marginTop: 5, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 서비스 카드 선택 섹션 */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, color: TEXT_HINT, letterSpacing: "2px", fontWeight: 800, marginBottom: 28, textAlign: "center", fontFamily: "'Orbitron', sans-serif" }}>
            CHOOSE YOUR ENGINE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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

        {/* 푸터 (스타일 유지) */}
        <div style={{ 
          textAlign: "center", marginTop: 80, padding: "28px", 
          background: `${SURFACE}60`, borderRadius: "24px", 
          fontSize: 12, color: TEXT_HINT, lineHeight: 2 
        }}>
          <strong style={{ color: TEXT_MUT }}>[투자 유의사항]</strong><br/>
          모든 투자 결정의 책임은 사용자 본인에게 있으며,<br/>
          과거의 수익률이 미래의 결과를 보장하지 않습니다.
        </div>
      </div>
    </div>
  )
}