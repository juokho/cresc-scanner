import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../supabase"
import { NavBar } from "../components/NavBar"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

function LogoIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
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
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/dashboard"

  // 로그인
  const handleLogin = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return }
    setLoading(true)
    setError("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message || "로그인에 실패했어요")
      console.error("Login error:", error)
    } else {
      // 세션이 완전히 설정될 때까지 대기 (최대 3초)
      let attempts = 0
      while (attempts < 30) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log("Session confirmed:", session.user.id)
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      navigate(from)
    }
    setLoading(false)
  }

  // 회원가입
  const handleSignup = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 해요"); return }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않아요"); return }
    setLoading(true)
    setError("")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { tier: "free" } }
    })
    if (error) {
      setError(error.message || "회원가입에 실패했어요")
      console.error("Signup error:", error)
    } else {
      setError("이메일을 확인해 인증 링크를 클릭하면 로그인할 수 있어요 ✓")
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
        justifyContent: "center",
        padding: "14px 18px",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        background: BG,
        zIndex: 10
      }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700 }}>
          <span style={{ color: BLUE_LT }}>CRESC</span>.SCANNER
        </span>
      </div>

      {/* 컨텐츠 */}
      <div style={{ padding: "40px 24px", maxWidth: 430, margin: "0 auto" }}>
        {/* 로고 및 설명 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoIcon size={56} />
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>
            미국 ETF 스캐너
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUT, lineHeight: 1.6 }}>
            실시간 시그널로 스마트한 투자 경험
          </div>
        </div>

        {/* 스캐너 스탯 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <StatCard value="60+" label="ETF 종목" />
          <StatCard value="양방향" label="Long/Short" />
          <StatCard value="디스코드" label="시그널 알림" />
        </div>

        {/* 탭 */}
        <div style={{
          display: "flex",
          background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          borderRadius: 10,
          padding: 4,
          marginBottom: 24
        }}>
          <Tab label="로그인" active={tab === "login"} onClick={() => { setTab("login"); setError("") }} />
          <Tab label="회원가입" active={tab === "signup"} onClick={() => { setTab("signup"); setError("") }} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: `${RED}22`,
            border: `0.5px solid ${RED}`,
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            color: RED,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {/* 폼 */}
        <div>
          <Field 
            label="이메일" 
            type="email" 
            placeholder="your@email.com" 
            value={email} 
            onChange={setEmail}
          />
          <Field 
            label={tab === "signup" ? "비밀번호 (8자 이상)" : "비밀번호"} 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={setPassword}
          />
          {tab === "signup" && (
            <Field 
              label="비밀번호 확인" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={setConfirmPassword}
            />
          )}
          <PrimaryBtn 
            label={tab === "login" ? "로그인" : "회원가입"} 
            onClick={tab === "login" ? handleLogin : handleSignup} 
            loading={loading}
          />
        </div>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0" }}>
          <div style={{ flex: 1, height: "0.5px", background: BORDER }} />
          <span style={{ fontSize: 11, color: TEXT_HINT }}>또는</span>
          <div style={{ flex: 1, height: "0.5px", background: BORDER }} />
        </div>

        {/* 홈으로 돌아가기 */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 8,
            color: TEXT_MUT,
            fontSize: 13,
            cursor: "pointer"
          }}
        >
          ← 홈으로 돌아가기
        </button>

        {/* 안내 문구 */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: TEXT_HINT, lineHeight: 1.6 }}>
          로그인하면 무료로 시그널 조회 가능<br/>
          프리미엄 기능은 별도 구매 필요
        </div>
      </div>

      <NavBar navigate={navigate} active="account" />
    </div>
  )
}
