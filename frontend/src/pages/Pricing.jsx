import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { setApiKey } from "../api"
import { StockNavBar } from "../components/NavBar"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, GOLD } from '../theme'

const PLANS = [
  {
    id: "free", name: "FREE", tag: "무료", tagColor: GREEN,
    desc: "시그널 조회만 필요한 사용자",
    priceLabel: "₩0", priceSub: "영구 무료",
    highlight: false,
    features: [
      { text: "실시간 시그널 조회",    ok: true  },
      { text: "미국 3X ETF 50+ 종목", ok: true  },
      { text: "LONG/SHORT/WAIT 시그널", ok: true },
      { text: "CI + Z-Score 표시",     ok: true  },
      { text: "포지션 추적",           ok: false },
      { text: "거래 내역 조회",        ok: false },
      { text: "디스코드 알림",         ok: false },
    ],
    cta: "무료로 시작하기",
  },
  {
    id: "premium", name: "PREMIUM", tag: "추천", tagColor: BLUE_LT,
    desc: "전체 기능이 필요한 트레이더",
    priceLabel: "₩29,000", priceLabelYearly: "₩23,200",
    priceSub: "/ 월", priceSubYearly: "/ 월 (연간 ₩278,400)",
    highlight: true,
    features: [
      { text: "FREE 모든 기능",         ok: true },
      { text: "실시간 포지션 추적",     ok: true },
      { text: "진입가/SL/TP 표시",      ok: true },
      { text: "거래 내역 전체 조회",    ok: true },
      { text: "디스코드 실시간 알림",   ok: true },
      { text: "API Key 전체 기능 접근", ok: true },
    ],
    cta: "PREMIUM 시작하기",
  },
  {
    id: "enterprise", name: "ENTERPRISE", tag: "문의", tagColor: GOLD,
    desc: "커스텀 개발 및 1:1 지원",
    priceLabel: "별도 문의", priceSub: "",
    highlight: false, disabled: true,
    features: [
      { text: "PREMIUM 모든 기능",  ok: true },
      { text: "커스텀 종목 추가",   ok: true },
      { text: "전략 파라미터 조정", ok: true },
      { text: "전용 디스코드 채널", ok: true },
      { text: "1:1 기술 지원",      ok: true },
    ],
    cta: "문의하기",
  },
]

// API Key 입력 모달 (prompt() 대체)
function ApiKeyModal({ onConfirm, onClose }) {
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
        <div style={{ fontSize:15, fontWeight:600, color: TEXT_PRI, marginBottom: 8 }}>API Key 입력</div>
        <div style={{ fontSize:12, color: TEXT_MUT, lineHeight:1.6, marginBottom:20 }}>
          입금 확인 후 전달받은 API Key를 입력하세요.<br/>
          구매 문의: <span style={{ color: BLUE_LT }}>support@quanter.io</span>
        </div>
        <input
          type="text"
          placeholder="cresc_xxxxxxxxxxxxxxxxxxxx"
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
            marginBottom: 16, transition:"border-color .2s",
          }}
        />
        <div style={{ display:"flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex:1, padding: 12, background:"transparent",
              border:`0.5px solid ${BORDER}`, borderRadius: 10,
              color: TEXT_MUT, fontSize:12, cursor:"pointer",
            }}
          >취소</button>
          <button
            onClick={() => key.trim() && onConfirm(key.trim())}
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

export default function Pricing() {
  const [yearly, setYearly]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const handleSelect = (plan) => {
    if (plan.disabled) {
      window.open("mailto:support@quanter.io?subject=ENTERPRISE 문의", "_blank")
      return
    }
    if (plan.id === "free") { navigate("/dashboard"); return }
    if (plan.id === "premium") { setShowModal(true) }
  }

  const handleApiKeyConfirm = (key) => {
    setApiKey(key)
    setShowModal(false)
    navigate("/dashboard")
  }

  return (
    <div style={{ background: BG, minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin:"0 auto" }}>
      {showModal && (
        <ApiKeyModal onConfirm={handleApiKeyConfirm} onClose={() => setShowModal(false)} />
      )}

      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:`0.5px solid ${BORDER}` }}>
        <div onClick={() => navigate(-1)} style={{ cursor:"pointer", padding:"4px 4px 4px 0" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily:"'Orbitron', sans-serif", fontSize:12, fontWeight:700, letterSpacing:"1px" }}>QUANTER</span>
      </div>

      <div style={{ padding:"24px 18px" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:20, fontWeight:500, color: TEXT_PRI, marginBottom:8 }}>
            미국 주식 양방향<br/>ETF 스캐너
          </div>
          <div style={{ fontSize:12, color: TEXT_MUT, lineHeight:1.6 }}>
            TQQQ · SQQQ · SOXL · SOXS 등<br/>
            <span style={{ color: GREEN, fontWeight:500 }}>50+ 개 레버리지 ETF</span> 실시간 모니터링
          </div>
        </div>

        {/* 월간/연간 토글 */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ display:"flex", background: SURFACE, border:`0.5px solid ${BORDER}`, borderRadius:10, padding:4 }}>
            {[
              { label:"월간", val: false },
              { label:"연간", val: true, badge:"20% 할인" },
            ].map(({ label, val, badge }) => (
              <div key={label} onClick={() => setYearly(val)} style={{
                padding:"7px 16px", borderRadius:7, fontSize:12, cursor:"pointer",
                background: yearly === val ? BLUE : "transparent",
                color: yearly === val ? "#fff" : TEXT_MUT,
                display:"flex", alignItems:"center", gap:6, transition:"all .2s",
              }}>
                {label}
                {badge && <span style={{ background: GREEN, color:"#fff", fontSize:9, padding:"2px 5px", borderRadius:4, fontWeight:700 }}>{badge}</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {PLANS.map(plan => {
            const isYearly = plan.id === "premium" && yearly
            const label    = isYearly ? plan.priceLabelYearly : plan.priceLabel
            const sub      = isYearly ? plan.priceSubYearly   : plan.priceSub

            return (
              <div key={plan.id} style={{
                background: plan.highlight ? "#0d1420" : SURFACE,
                border:`0.5px solid ${plan.highlight ? BLUE : BORDER}`,
                borderRadius:14, padding:"18px 16px",
                opacity: plan.disabled ? 0.6 : 1, position:"relative",
              }}>
                {plan.highlight && (
                  <div style={{
                    position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
                    background: BLUE, color:"#fff", fontSize:10, padding:"3px 12px",
                    borderRadius:20, letterSpacing:"1px", fontFamily:"'Orbitron', sans-serif",
                  }}>RECOMMENDED</div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'Orbitron', sans-serif", fontSize:14, fontWeight:700 }}>{plan.name}</span>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, background:`${plan.tagColor}22`, color: plan.tagColor, fontWeight:700 }}>{plan.tag}</span>
                    </div>
                    <div style={{ fontSize:11, color: TEXT_MUT }}>{plan.desc}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize:18, fontWeight:900, color: plan.highlight ? BLUE_LT : TEXT_PRI }}>{label}</div>
                    {sub && <div style={{ fontSize:10, color: TEXT_MUT, marginTop:2 }}>{sub}</div>}
                  </div>
                </div>
                <div style={{ height:"0.5px", background: BORDER, marginBottom:12 }}/>
                <div style={{ marginBottom:16 }}>
                  {plan.features.map(({ text, ok }) => (
                    <div key={text} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6.5" fill={ok ? (plan.highlight ? BLUE : SURFACE) : SURFACE} stroke={ok ? (plan.highlight ? BLUE : BORDER) : BORDER}/>
                        {ok
                          ? <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          : <path d="M5 5l4 4M9 5l-4 4" stroke={TEXT_HINT} strokeWidth="1.2" strokeLinecap="round"/>
                        }
                      </svg>
                      <span style={{ fontSize:12, color: ok ? TEXT_PRI : TEXT_HINT }}>{text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSelect(plan)}
                  style={{
                    width:"100%",
                    background: plan.disabled ? "transparent" : plan.highlight ? BLUE : "transparent",
                    border:`0.5px solid ${plan.disabled ? BORDER : plan.highlight ? BLUE : BORDER}`,
                    borderRadius:10, padding:13,
                    fontFamily:"'Orbitron', sans-serif", fontSize:11, fontWeight:700,
                    color: plan.disabled ? TEXT_HINT : plan.highlight ? "#fff" : TEXT_PRI,
                    letterSpacing:"1px", cursor: plan.disabled ? "not-allowed" : "pointer",
                    transition:"all .2s",
                  }}
                >{plan.cta}</button>
              </div>
            )
          })}
        </div>

        {/* 결제 안내 */}
        <div style={{ background: SURFACE, border:`0.5px solid ${BORDER}`, borderRadius:12, padding:14, marginTop:20 }}>
          <div style={{ fontSize:9, color: TEXT_HINT, letterSpacing:"2px", marginBottom:10 }}>PREMIUM 구매 안내</div>
          {[
            ["문의", "support@quanter.io"],
            ["월간", "₩29,000"],
            ["연간", "₩278,400 (20% 할인)"],
            ["활성화", "입금 확인 후 24시간 내"],
          ].map(([label, value]) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
              <span style={{ color: TEXT_MUT }}>{label}</span>
              <span style={{ color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:16, fontSize:10, color: TEXT_HINT, lineHeight:1.6 }}>
          스캐너는 투자 참고용이며 모든 투자 결정과<br/>손실은 사용자 본인의 책임입니다
        </div>
      </div>
      <StockNavBar navigate={navigate} active="pricing" />
    </div>
  )
}
