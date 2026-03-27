import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

const BLUE      = "#3B5BDB"
const BLUE_LT   = "#4C6EF5"
const BLUE_DK   = "#1e2d7a"
const BG        = "#080c10"
const SURFACE   = "#0d1218"
const BORDER    = "#1c2530"
const TEXT_PRI  = "#e2e8f0"
const TEXT_MUT  = "#4a5568"
const TEXT_HINT = "#2a3545"
const RED       = "#ef4444"

function LogoIcon({ size = 44, radius = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx={radius * (128 / size)} fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={{
      flex: 1, background: SURFACE,
      border: `0.5px solid ${BORDER}`,
      borderRadius: 10, padding: "11px 8px", textAlign: "center"
    }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: BLUE_LT }}>{value}</div>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Tab({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: 10, textAlign: "center",
      fontSize: 13, borderRadius: 8, cursor: "pointer",
      background: active ? BLUE : "transparent",
      color: active ? "#fff" : TEXT_MUT,
      fontWeight: active ? 500 : 400,
      transition: "all 0.2s"
    }}>
      {label}
    </div>
  )
}

function Field({ label, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
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
        style={{
          width: "100%", background: SURFACE,
          border: `0.5px solid ${focused ? BLUE : BORDER}`,
          borderRadius: 10, padding: "13px 14px",
          fontSize: 14, color: TEXT_PRI,
          fontFamily: "'DM Sans', sans-serif",
          outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s"
        }}
      />
    </div>
  )
}

function PrimaryBtn({ label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", background: loading ? "#2a3a8a" : BLUE,
        border: "none", borderRadius: 10, padding: 14,
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 11, fontWeight: 700, color: "#fff",
        letterSpacing: "2px", marginTop: 4,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.2s"
      }}
    >
      {loading ? "처리 중..." : label}
    </button>
  )
}

function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: "0.5px", background: BORDER }} />
      <div style={{ fontSize: 11, color: TEXT_HINT }}>OR</div>
      <div style={{ flex: 1, height: "0.5px", background: BORDER }} />
    </div>
  )
}

function GoogleBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "transparent",
      border: `0.5px solid ${BORDER}`, borderRadius: 10,
      padding: 13, fontSize: 13, color: "#6b7280",
      display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Google로 계속하기
    </button>
  )
}

function Terms() {
  return (
    <div style={{ fontSize: 10, color: TEXT_HINT, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
      가입 시{" "}
      <a href="#" style={{ color: TEXT_MUT, textDecoration: "none" }}>이용약관</a>
      {" "}및{" "}
      <a href="#" style={{ color: TEXT_MUT, textDecoration: "none" }}>개인정보처리방침</a>
      에 동의합니다
    </div>
  )
}

export default function Login() {
  const [tab,      setTab]      = useState("login")
  const [name,     setName]     = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const navigate = useNavigate()

  // 로그인
  const handleLogin = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return }
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요")
    } else {
      navigate("/dashboard")
    }
    setLoading(false)
  }

  // 회원가입
  const handleSignup = async () => {
    if (!name || !email || !password) { setError("모든 항목을 입력해주세요"); return }
    if (password.length < 8) { setError("비밀번호는 8자 이상이어야 해요"); return }
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) {
      setError("회원가입에 실패했어요. 다시 시도해주세요")
    } else {
      navigate("/onboarding")
    }
    setLoading(false)
  }

  // Google 로그인
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      display: "flex", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "32px 22px 48px" }}>

        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <LogoIcon size={44} radius={12}/>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: TEXT_PRI, letterSpacing: "2px", lineHeight: 1 }}>
              <span style={{ color: BLUE_LT }}>Cresc</span>
              <span style={{ color: BLUE_DK }}>.</span>
              <span style={{ color: TEXT_PRI }}>Q</span>
            </div>
            <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "3px", marginTop: 3 }}>
              QUANTITATIVE TRADING
            </div>
          </div>
        </div>

        {/* 라이브 뱃지 */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 20, padding: "6px 12px",
          fontSize: 11, color: TEXT_MUT, marginBottom: 18
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: BLUE_LT }} />
          LIVE TRADING ACTIVE
        </div>

        {/* 스탯 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <StatCard value="+50.38%" label="수익률" />
          <StatCard value="73.94%"  label="승률" />
          <StatCard value="2.326"   label="Profit Factor" />
        </div>

        {/* 전략 설명 */}
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 10, padding: "10px 14px",
          marginBottom: 22, display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: BLUE_LT, flexShrink: 0 }}/>
          <div style={{ fontSize: 11, color: TEXT_MUT, lineHeight: 1.6 }}>
            <span style={{ color: TEXT_PRI, fontWeight: 500 }}>ETHUSDT.P</span>
            {" "}선물 기준 · 3/2 ~ 3/23 (21일)
            <br/>
            MDD <span style={{ color: TEXT_PRI }}>2.43%</span> · 449거래 · 바이낸스 5분봉
          </div>
        </div>

        {/* 헤드라인 */}
        <div style={{ fontSize: 21, fontWeight: 500, color: TEXT_PRI, lineHeight: 1.35, marginBottom: 6 }}>
          알고리즘 트레이딩<br/>지금 시작하세요
        </div>
        <div style={{ fontSize: 13, color: TEXT_MUT, marginBottom: 24, lineHeight: 1.6 }}>
          바이낸스 API 키만 입력하면<br/>자동으로 매매를 시작해요
        </div>

        {/* 탭 */}
        <div style={{
          display: "flex", background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          borderRadius: 12, padding: 4, marginBottom: 18
        }}>
          <Tab label="로그인"   active={tab === "login"}  onClick={() => { setTab("login");  setError("") }} />
          <Tab label="회원가입" active={tab === "signup"} onClick={() => { setTab("signup"); setError("") }} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: "#1a0808", border: `0.5px solid #3a1010`,
            borderRadius: 8, padding: "10px 14px",
            fontSize: 12, color: RED, marginBottom: 14
          }}>
            {error}
          </div>
        )}

        {/* 폼 */}
        {tab === "login" ? (
          <div>
            <Field label="이메일"   type="email"    placeholder="your@email.com" value={email}    onChange={setEmail}/>
            <Field label="비밀번호" type="password" placeholder="••••••••"       value={password} onChange={setPassword}/>
            <div style={{ textAlign: "right", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: TEXT_MUT, cursor: "pointer" }}>비밀번호 찾기</span>
            </div>
            <PrimaryBtn label="LOGIN" onClick={handleLogin} loading={loading}/>
            <OrDivider/>
            <GoogleBtn onClick={handleGoogle}/>
            <Terms/>
          </div>
        ) : (
          <div>
            <Field label="이름"     type="text"     placeholder="홍길동"         value={name}     onChange={setName}/>
            <Field label="이메일"   type="email"    placeholder="your@email.com" value={email}    onChange={setEmail}/>
            <Field label="비밀번호" type="password" placeholder="8자 이상"       value={password} onChange={setPassword}/>
            <PrimaryBtn label="CREATE ACCOUNT" onClick={handleSignup} loading={loading}/>
            <OrDivider/>
            <GoogleBtn onClick={handleGoogle}/>
            <Terms/>
          </div>
        )}

      </div>
    </div>
  )
}
