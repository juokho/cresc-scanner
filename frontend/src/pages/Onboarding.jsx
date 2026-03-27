import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

const API_URL = "http://localhost:8000"

function LogoIcon({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="28" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

function StepDots({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6,
          width: i === current ? 20 : 6,
          borderRadius: i === current ? 3 : "50%",
          background: i === current ? BLUE : BORDER,
          transition: "all .3s"
        }}/>
      ))}
    </div>
  )
}

function PrimaryBtn({ label, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", background: loading ? "#2a3a8a" : BLUE,
      border: "none", borderRadius: 10, padding: 14,
      fontFamily: "'Orbitron', sans-serif",
      fontSize: 11, fontWeight: 700, color: "#fff",
      letterSpacing: "2px", cursor: loading ? "not-allowed" : "pointer",
      transition: "background .2s"
    }}>
      {loading ? "처리 중..." : label}
    </button>
  )
}

function GhostBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "transparent",
      border: `0.5px solid ${BORDER}`, borderRadius: 10,
      padding: 13, fontSize: 12, color: TEXT_MUT,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
    }}>
      {label}
    </button>
  )
}

function Field({ label, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, letterSpacing: "1px" }}>{label}</div>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: SURFACE,
          border: `0.5px solid ${focused ? BLUE : BORDER}`,
          borderRadius: 10, padding: "13px 14px",
          fontSize: 13, color: TEXT_PRI,
          fontFamily: "'DM Sans', sans-serif",
          outline: "none", boxSizing: "border-box",
          transition: "border-color .2s"
        }}
      />
    </div>
  )
}

// ============================================================
// STEP 1
// ============================================================
function Step1({ onNext }) {
  return (
    <div>
      <StepDots current={0} total={3}/>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <LogoIcon size={72}/>
      </div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: TEXT_PRI, letterSpacing: "1px", marginBottom: 4 }}>
          <span style={{ color: BLUE_LT }}>Cresc</span>.Q
        </div>
        <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "3px" }}>QUANTITATIVE TRADING</div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRI, lineHeight: 1.4, marginBottom: 8 }}>환영합니다 👋</div>
        <div style={{ fontSize: 13, color: TEXT_MUT, lineHeight: 1.6 }}>
          바이낸스 API 키를 연결하면<br/>알고리즘이 자동으로 매매를<br/>시작해요
        </div>
      </div>
      <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 28 }}>
        <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>ETHUSDT.P 기준 실전 성과</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[
            { value: "+50.38%", label: "21일 수익률" },
            { value: "73.94%",  label: "승률" },
            { value: "2.326",   label: "Profit Factor" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: BLUE_LT }}>{value}</div>
              <div style={{ fontSize: 9, color: TEXT_MUT, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <PrimaryBtn label="시작하기" onClick={onNext}/>
    </div>
  )
}

// ============================================================
// STEP 2 — API 키 입력 (서버에서 암호화)
// ============================================================
function Step2({ onNext, onSkip }) {
  const [apiKey,  setApiKey]  = useState("")
  const [secret,  setSecret]  = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleConnect = async () => {
    if (!apiKey || !secret) { setError("API 키와 Secret 키를 모두 입력해주세요"); return }
    setLoading(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요해요")

      // 서버에서 암호화 후 저장
      const res = await fetch(`${API_URL}/api-key/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:    user.id,
          api_key:    apiKey,
          secret_key: secret,
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "저장 실패")
      }
      onNext()
    } catch (e) {
      setError(e.message || "연결에 실패했어요")
    }
    setLoading(false)
  }

  return (
    <div>
      <StepDots current={1} total={3}/>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRI, marginBottom: 8 }}>바이낸스 연결</div>
        <div style={{ fontSize: 13, color: TEXT_MUT, lineHeight: 1.6 }}>
          선물 거래 권한이 있는<br/>API 키를 입력해주세요
        </div>
      </div>

      <div style={{
        background: SURFACE, border: `0.5px solid ${BORDER}`,
        borderRadius: 10, padding: "12px 14px",
        marginBottom: 20, display: "flex",
        alignItems: "center", gap: 10, cursor: "pointer"
      }} onClick={() => window.open("https://www.binance.com/ko/support/faq/api", "_blank")}>
        <div style={{
          width: 28, height: 28, background: BORDER, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke={TEXT_MUT} strokeWidth="1.2"/>
            <path d="M8 7v4M8 5.5v.5" stroke={TEXT_MUT} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: TEXT_PRI, marginBottom: 2 }}>API 키 발급 방법</div>
          <div style={{ fontSize: 10, color: BLUE_LT }}>바이낸스 가이드 보기 →</div>
        </div>
      </div>

      <Field label="API KEY"    type="text"     placeholder="발급받은 API Key"   value={apiKey} onChange={setApiKey}/>
      <Field label="SECRET KEY" type="password" placeholder="Secret Key 입력"    value={secret} onChange={setSecret}/>

      {error && (
        <div style={{
          background: "#1a0808", border: "0.5px solid #3a1010",
          borderRadius: 8, padding: "10px 14px",
          fontSize: 12, color: RED, marginBottom: 14
        }}>{error}</div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "12px 0 24px" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEXT_HINT, marginTop: 5, flexShrink: 0 }}/>
        <div style={{ fontSize: 10, color: TEXT_HINT, lineHeight: 1.6 }}>
          API 키는 AES-256으로 암호화되어 저장되며<br/>출금 권한 없이 거래만 가능해요
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryBtn label="연결하기" onClick={handleConnect} loading={loading}/>
        <GhostBtn   label="나중에 설정하기" onClick={onSkip}/>
      </div>
    </div>
  )
}

// ============================================================
// STEP 3
// ============================================================
function Step3({ onDone }) {
  return (
    <div>
      <StepDots current={2} total={3}/>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, background: SURFACE,
          border: `0.5px solid ${BORDER}`, borderRadius: 20,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke={GREEN} strokeWidth="1.5"/>
            <path d="M10 16l4 4 8-8" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRI, marginBottom: 8 }}>연결 완료!</div>
        <div style={{ fontSize: 13, color: TEXT_MUT, lineHeight: 1.6 }}>
          바이낸스 API가 성공적으로<br/>연결됐어요. 이제 자동매매를<br/>시작할 수 있어요
        </div>
      </div>
      <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 28 }}>
        {[
          { label: "연결 상태", value: "✓ 연결됨",      color: GREEN    },
          { label: "암호화",   value: "✓ AES-256",     color: GREEN    },
          { label: "거래 권한", value: "✓ 선물 거래",   color: GREEN    },
          { label: "출금 권한", value: "✗ 없음 (안전)", color: TEXT_MUT },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: TEXT_MUT }}>{label}</span>
            <span style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      <PrimaryBtn label="대시보드 시작" onClick={onDone}/>
    </div>
  )
}

// ============================================================
// 메인
// ============================================================
export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate        = useNavigate()

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      display: "flex", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "40px 22px 48px" }}>
        {step === 0 && <Step1 onNext={() => setStep(1)}/>}
        {step === 1 && <Step2 onNext={() => setStep(2)} onSkip={() => navigate("/dashboard")}/>}
        {step === 2 && <Step3 onDone={() => navigate("/dashboard")}/>}
      </div>
    </div>
  )
}
