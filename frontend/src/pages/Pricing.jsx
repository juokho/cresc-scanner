import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

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

const PLANS = [
  {
    id:       "basic",
    name:     "BASIC",
    tag:      "체험판",
    tagColor: GREEN,
    desc:     "알고리즘 매매 첫 경험",
    price:    9900,
    priceLabel: "₩9,900",
    priceSub:   "10회 소진까지 · 1회성",
    yearly:   false,
    highlight: false,
    features: [
      { text: "자동매매 10회",          ok: true  },
      { text: "ETH 단일 종목",          ok: true  },
      { text: "레버리지 20x 고정",       ok: true  },
      { text: "실시간 포지션 확인",      ok: true  },
      { text: "다종목 지원",             ok: false },
      { text: "디스코드 알림",           ok: false },
    ],
    cta: "체험 시작하기",
  },
  {
    id:       "pro",
    name:     "PRO",
    tag:      "추천",
    tagColor: BLUE_LT,
    desc:     "제한 없는 자동매매",
    price:      54000,
    priceYearly: 43200,
    priceLabel:  "₩54,000",
    priceLabelYearly: "₩43,200",
    priceSub:    "/ 월",
    priceSubYearly: "/ 월 (연간 ₩518,400)",
    yearly:    true,
    highlight: true,
    features: [
      { text: "자동매매 무제한",         ok: true },
      { text: "BTC / ETH / SOL 3종목",  ok: true },
      { text: "레버리지 최대 75x",       ok: true },
      { text: "실시간 포지션 확인",      ok: true },
      { text: "디스코드 알림",           ok: true },
      { text: "우선 고객 지원",          ok: true },
    ],
    cta: "PRO 시작하기",
  },
  {
    id:       "elite",
    name:     "ELITE",
    tag:      "개발 중",
    tagColor: GOLD,
    desc:     "곧 출시 예정",
    price:    null,
    priceLabel: "준비 중",
    priceSub:   "",
    yearly:   false,
    highlight: false,
    disabled:  true,
    features: [
      { text: "PRO 모든 기능",           ok: true  },
      { text: "레버리지 최대 125x",      ok: true  },
      { text: "종목 추가 요청",          ok: true  },
      { text: "1:1 전담 지원",           ok: true  },
      { text: "도파민 모드 🔥",          ok: true  },
    ],
    cta: "출시 알림 받기",
  },
]

export default function Pricing() {
  const [yearly,  setYearly]  = useState(false)
  const [loading, setLoading] = useState("")
  const navigate = useNavigate()

  const handleSelect = async (plan) => {
    if (plan.disabled) {
      alert("곧 출시 예정이에요! 알림을 보내드릴게요 🙏")
      return
    }

    setLoading(plan.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate("/"); return }

      if (plan.id === "basic") {
        // BASIC: 크레딧 10회 지급 (계좌이체 확인 후 수동 지급 — 현재는 테스트용 자동)
        const { error } = await supabase.from("subscriptions").upsert({
          user_id:       user.id,
          plan:          "basic",
          credits:       10,
          billing_cycle: null,
          is_active:     true,
          expires_at:    null,
        }, { onConflict: "user_id" })
        if (error) throw error
        alert("BASIC 플랜이 활성화됐어요!\n자동매매 10회 크레딧이 지급됐어요.")
        navigate("/dashboard")
      } else if (plan.id === "pro") {
        // PRO: 계좌이체 안내
        const cycle   = yearly ? "yearly" : "monthly"
        const amount  = yearly ? 518400   : 54000
        const expires = new Date()
        if (yearly) expires.setFullYear(expires.getFullYear() + 1)
        else        expires.setMonth(expires.getMonth() + 1)

        const { error } = await supabase.from("subscriptions").upsert({
          user_id:       user.id,
          plan:          "pro",
          credits:       -1,   // -1 = 무제한
          billing_cycle: cycle,
          is_active:     false,  // 입금 확인 후 활성화
          expires_at:    expires.toISOString(),
        }, { onConflict: "user_id" })
        if (error) throw error

        alert(
          `PRO 플랜 신청이 완료됐어요!\n\n` +
          `입금 금액: ₩${amount.toLocaleString()}\n` +
          `입금 계좌: 카카오뱅크 000-0000-0000 차호준\n` +
          `입금자명: 본인 이름\n\n` +
          `입금 확인 후 24시간 내 활성화됩니다.`
        )
        navigate("/dashboard")
      }
    } catch (e) {
      alert("오류가 발생했어요: " + e.message)
    }
    setLoading("")
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
          플랜 선택
        </span>
      </div>

      <div style={{ padding: "24px 18px" }}>

        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRI, marginBottom: 8 }}>
            나에게 맞는 플랜을<br/>선택해주세요
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUT, lineHeight: 1.6 }}>
            현재 시스템 승률 <span style={{ color: GREEN, fontWeight: 500 }}>68%</span> 기준<br/>
            5회 이상부터 통계적 수익 구간 진입
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

        {/* 계좌이체 안내 */}
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 12, padding: 14, marginTop: 20
        }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>결제 안내</div>
          {[
            ["결제 방식", "계좌이체"],
            ["입금 계좌", "카카오뱅크 000-0000-0000"],
            ["예금주",   "차호준"],
            ["활성화",   "입금 확인 후 24시간 내"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 이용약관 */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: TEXT_HINT, lineHeight: 1.6 }}>
          구매 시 이용약관에 동의합니다<br/>
          투자 손실에 대한 책임은 사용자에게 있습니다
        </div>

      </div>
    </div>
  )
}
