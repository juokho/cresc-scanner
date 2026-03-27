import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { setApiKey } from "../api"

const BLUE     = "#3B5BDB"
const BLUE_LT  = "#4C6EF5"
const BG       = "#080c10"
const SURFACE  = "#0d1218"
const BORDER   = "#1c2530"
const TEXT_PRI = "#e2e8f0"
const TEXT_MUT = "#4a5568"
const TEXT_HINT= "#2a3545"
const GREEN    = "#22c55e"
const GOLD     = "#f59e0b"
const RED      = "#ef4444"

const PLANS = [
  {
    id:       "free",
    name:     "FREE",
    tag:      "무료",
    tagColor: GREEN,
    desc:     "시그널 조회만 필요한 사용자",
    price:    0,
    priceLabel: "₩0",
    priceSub:   "영구 무료",
    yearly:   false,
    highlight: false,
    features: [
      { text: "실시간 시그널 조회",          ok: true  },
      { text: "미국 3X ETF 60+ 종목",        ok: true  },
      { text: "LONG/SHORT/WAIT 시그널",      ok: true  },
      { text: "CI 지수 + Z-Score 표시",       ok: true  },
      { text: "포지션 추적 기능",            ok: false },
      { text: "거래 내역 조회",              ok: false },
      { text: "디스코드 알림",               ok: false },
    ],
    cta: "무료로 시작하기",
  },
  {
    id:       "premium",
    name:     "PREMIUM",
    tag:      "추천",
    tagColor: BLUE_LT,
    desc:     "전체 기능이 필요한 트레이더",
    price:      29000,
    priceYearly: 23200,
    priceLabel:  "₩29,000",
    priceLabelYearly: "₩23,200",
    priceSub:    "/ 월",
    priceSubYearly: "/ 월 (연간 ₩278,400)",
    yearly:    true,
    highlight: true,
    features: [
      { text: "FREE 모든 기능",              ok: true },
      { text: "실시간 포지션 추적",          ok: true },
      { text: "진입가/손절가/익절가 표시",   ok: true },
      { text: "거래 내역 전체 조회",         ok: true },
      { text: "디스코드 실시간 알림",        ok: true },
      { text: "API Key로 전체 기능 접근",    ok: true },
    ],
    cta: "PREMIUM 시작하기",
  },
  {
    id:       "enterprise",
    name:     "ENTERPRISE",
    tag:      "문의",
    tagColor: GOLD,
    desc:     "커스텀 개발 및 1:1 지원",
    price:    null,
    priceLabel: "별도 문의",
    priceSub:   "",
    yearly:   false,
    highlight: false,
    disabled:  true,
    features: [
      { text: "PREMIUM 모든 기능",           ok: true  },
      { text: "커스텀 종목 추가",            ok: true  },
      { text: "전략 파라미터 조정",          ok: true  },
      { text: "전용 디스코드 채널",          ok: true  },
      { text: "1:1 기술 지원",               ok: true  },
    ],
    cta: "문의하기",
  },
]

export default function Pricing() {
  const [yearly,  setYearly]  = useState(false)
  const [loading, setLoading] = useState("")
  const [apiKeyInput, setApiKeyInput] = useState("")
  const navigate = useNavigate()

  const handleSelect = async (plan) => {
    if (plan.disabled) {
      alert("기업용 문의는 cha@example.com 으로 연락주세요 🙏")
      return
    }

    if (plan.id === "free") {
      // FREE: 그냥 대시보드로
      navigate("/dashboard")
      return
    }

    if (plan.id === "premium") {
      // PREMIUM: API Key 입력 모달 또는 안내
      const key = prompt(
        "PREMIUM 기능을 사용하려면 API Key가 필요합니다.\n\n" +
        "구매 문의: cha@example.com\n" +
        "계좌: 카카오뱅크 000-0000-0000 (차호준)\n\n" +
        "입금 후 받은 API Key를 입력하세요:"
      )
      if (key && key.trim()) {
        setApiKey(key.trim())
        alert("API Key가 설정되었습니다!\nPREMIUM 기능을 사용할 수 있습니다.")
        navigate("/dashboard")
      }
    }
  }

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      color: TEXT_PRI, maxWidth: 430,
      margin: "0 auto"
    }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div onClick={() => navigate(-1)} style={{ cursor: "pointer", padding: "4px 4px 4px 0" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>
          CRESC SCANNER
        </span>
      </div>

      <div style={{ padding: "24px 18px" }}>

        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRI, marginBottom: 8 }}>
            미국 주식 양방향<br/>ETF 스캐너
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUT, lineHeight: 1.6 }}>
            TQQQ · SQQQ · SOXL · SOXS 등<br/>
            <span style={{ color: GREEN, fontWeight: 500 }}>60+ 개 3X 레버리지 ETF</span> 실시간 모니터링
          </div>
        </div>

        {/* 연간/월간 토글 */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            display: "flex", background: SURFACE,
            border: `0.5px solid ${BORDER}`,
            borderRadius: 10, padding: 4
          }}>
            <div onClick={() => setYearly(false)} style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12,
              cursor: "pointer", transition: "all .2s",
              background: !yearly ? BLUE : "transparent",
              color: !yearly ? "#fff" : TEXT_MUT
            }}>월간</div>
            <div onClick={() => setYearly(true)} style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12,
              cursor: "pointer", transition: "all .2s",
              background: yearly ? BLUE : "transparent",
              color: yearly ? "#fff" : TEXT_MUT,
              display: "flex", alignItems: "center", gap: 6
            }}>
              연간
              <span style={{
                background: GREEN, color: "#fff",
                fontSize: 9, padding: "2px 5px",
                borderRadius: 4, fontWeight: 700
              }}>20% 할인</span>
            </div>
          </div>
        </div>

        {/* 플랜 카드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map(plan => {
            const isYearlyApplicable = plan.yearly && yearly
            const price    = isYearlyApplicable ? plan.priceYearly    : plan.price
            const label    = isYearlyApplicable ? plan.priceLabelYearly : plan.priceLabel
            const priceSub = isYearlyApplicable ? plan.priceSubYearly  : plan.priceSub

            return (
              <div key={plan.id} style={{
                background: plan.highlight ? "#0d1420" : SURFACE,
                border: `0.5px solid ${plan.highlight ? BLUE : BORDER}`,
                borderRadius: 14, padding: "18px 16px",
                opacity: plan.disabled ? 0.6 : 1,
                position: "relative"
              }}>

                {/* 추천 뱃지 */}
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%",
                    transform: "translateX(-50%)",
                    background: BLUE, color: "#fff",
                    fontSize: 10, padding: "3px 12px",
                    borderRadius: 20, letterSpacing: "1px",
                    fontFamily: "'Orbitron', sans-serif"
                  }}>RECOMMENDED</div>
                )}

                {/* 플랜 헤더 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>
                        {plan.name}
                      </span>
                      <span style={{
                        fontSize: 9, padding: "2px 7px",
                        borderRadius: 4, letterSpacing: "1px",
                        background: `${plan.tagColor}22`,
                        color: plan.tagColor, fontWeight: 700
                      }}>{plan.tag}</span>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUT }}>{plan.desc}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: plan.highlight ? BLUE_LT : TEXT_PRI }}>
                      {label}
                    </div>
                    {priceSub && (
                      <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{priceSub}</div>
                    )}
                  </div>
                </div>

                {/* 구분선 */}
                <div style={{ height: "0.5px", background: BORDER, marginBottom: 12 }}/>

                {/* 기능 목록 */}
                <div style={{ marginBottom: 16 }}>
                  {plan.features.map(({ text, ok }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 14, height: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {ok ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6.5" fill={plan.highlight ? BLUE : SURFACE} stroke={plan.highlight ? BLUE : BORDER}/>
                            <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6.5" stroke={BORDER}/>
                            <path d="M5 5l4 4M9 5l-4 4" stroke={TEXT_HINT} strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: ok ? TEXT_PRI : TEXT_HINT }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 버튼 */}
                <button
                  onClick={() => handleSelect(plan)}
                  disabled={loading === plan.id}
                  style={{
                    width: "100%",
                    background: plan.disabled ? "transparent" : plan.highlight ? BLUE : "transparent",
                    border: `0.5px solid ${plan.disabled ? BORDER : plan.highlight ? BLUE : BORDER}`,
                    borderRadius: 10, padding: 13,
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    color: plan.disabled ? TEXT_HINT : plan.highlight ? "#fff" : TEXT_PRI,
                    letterSpacing: "1px", cursor: plan.disabled ? "not-allowed" : "pointer",
                    transition: "all .2s"
                  }}
                >
                  {loading === plan.id ? "처리 중..." : plan.cta}
                </button>

              </div>
            )
          })}
        </div>

        {/* 결제 안내 */}
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 12, padding: 14, marginTop: 20
        }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>PREMIUM 구매 안내</div>
          {[
            ["입금 계좌", "카카오뱅크 3333-12-3456789"],
            ["예금주",   "차호준"],
            ["월간",     "₩29,000"],
            ["연간",     "₩278,400 (20% 할인)"],
            ["활성화",   "입금 확인 후 24시간 내"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 면책 조항 */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: TEXT_HINT, lineHeight: 1.6 }}>
          스캐너는 투자 참고용이며 모든 투자 결정과<br/>
          손실은 사용자 본인의 책임입니다
        </div>

      </div>
    </div>
  )
}
