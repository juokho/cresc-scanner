import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import { checkAuth } from "../../api"
import { DynamicNavBar } from "../../components/NavBar"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER } from '../../theme'

function LogoIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.25"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9.2" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9.2" strokeLinecap="round"/>
    </svg>
  )
}

const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "https://quanter-trading-api.onrender.com"

async function getTradingHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token || ""}`
  }
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, letterSpacing: "0.5px" }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: BG,
          border: `0.5px solid ${BORDER}`, borderRadius: 8,
          padding: "11px 14px", color: TEXT_PRI,
          fontSize: 12, boxSizing: "border-box",
          outline: "none"
        }}
      />
    </div>
  )
}

export default function Account() {
  const [user,        setUser]        = useState(null)
  const [tier,        setTier]        = useState("free")
  const [isPremium,   setIsPremium]   = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  // Binance API 키 상태
  const [apiKey,      setApiKey]      = useState("")
  const [secretKey,   setSecretKey]   = useState("")
  const [hasApiKey,   setHasApiKey]   = useState(false)
  const [apiSaving,   setApiSaving]   = useState(false)
  const [apiMsg,      setApiMsg]      = useState("")
  const [apiError,    setApiError]    = useState("")
  const [showApiForm, setShowApiForm] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const auth = await checkAuth()
      setUser(auth.user)
      setTier(auth.tier || "free")
      setIsPremium(auth.is_premium || false)
      setAuthChecked(true)
    }
    loadUser()
    checkApiKey()
  }, [])

  // Binance API 키 등록 여부 확인
  const checkApiKey = async () => {
    try {
      const headers = await getTradingHeaders()
      const res = await fetch(`${TRADING_API_URL}/status`, { headers })
      if (res.ok) {
        const status = await res.json()
        setHasApiKey(status.has_api_key || false)
      }
    } catch {}
  }

  const handleSaveApiKey = async () => {
    if (!apiKey || !secretKey) {
      setApiError("API 키와 Secret 키를 모두 입력하세요")
      return
    }
    setApiSaving(true)
    setApiError("")
    try {
      const headers = await getTradingHeaders()
      const res = await fetch(`${TRADING_API_URL}/api-key/save`, {
        method: "POST", headers,
        body: JSON.stringify({ api_key: apiKey, secret_key: secretKey })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "저장 실패")
      }
      setApiMsg("✓ Binance API 키가 저장됐어요")
      setHasApiKey(true)
      setShowApiForm(false)
      setApiKey(""); setSecretKey("")
      setTimeout(() => setApiMsg(""), 3000)
    } catch (e) {
      setApiError(e.message || "저장에 실패했어요")
    } finally {
      setApiSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, paddingBottom: 100 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <LogoIcon size={26}/>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>
          <span style={{ color: BLUE_LT }}>QUANTER</span>
          <span style={{ color: TEXT_MUT }}>.ACCOUNT</span>
        </span>
      </div>

      <div style={{ padding: "20px 18px", maxWidth: 430, margin: "0 auto" }}>
        {!authChecked ? (
          <div style={{ textAlign: "center", padding: "40px", color: TEXT_HINT }}>로딩 중...</div>
        ) : (
          <>
            {/* 플랜 */}
            <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: TEXT_MUT }}>현재 플랜</span>
                <span style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 4, fontWeight: 700,
                  background: isPremium ? `${BLUE}33` : `${TEXT_MUT}22`,
                  color: isPremium ? BLUE_LT : TEXT_MUT
                }}>
                  {tier.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: TEXT_PRI, marginBottom: 10 }}>
                {isPremium ? "전체 기능 사용 중" : "시그널 조회만 가능"}
              </div>
              {!isPremium && (
                <button
                  onClick={() => navigate("/pricing")}
                  style={{ width: "100%", padding: "10px", background: BLUE, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  PREMIUM 업그레이드
                </button>
              )}
            </div>

            {/* ── Binance API 키 ─────────────────────────────── */}
            <div style={{ background: SURFACE, border: `0.5px solid ${hasApiKey ? GREEN+"40" : AMBER+"40"}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRI, marginBottom: 3 }}>
                    Binance API 연결
                  </div>
                  <div style={{ fontSize: 10, color: hasApiKey ? GREEN : AMBER }}>
                    {hasApiKey ? "✓ 연결됨 — 자동매매 사용 가능" : "⚡ 미연결 — 자동매매 사용 불가"}
                  </div>
                </div>
                <button
                  onClick={() => setShowApiForm(!showApiForm)}
                  style={{
                    background: "transparent",
                    border: `0.5px solid ${BORDER}`,
                    borderRadius: 8, padding: "6px 14px",
                    color: TEXT_MUT, fontSize: 10, cursor: "pointer"
                  }}
                >
                  {hasApiKey ? "재등록" : "등록하기"}
                </button>
              </div>

              {/* 성공/에러 메시지 */}
              {apiMsg && (
                <div style={{ padding: "8px 12px", background: `${GREEN}15`, border: `0.5px solid ${GREEN}40`, borderRadius: 8, fontSize: 11, color: GREEN, marginBottom: 12 }}>
                  {apiMsg}
                </div>
              )}
              {apiError && (
                <div style={{ padding: "8px 12px", background: `${RED}15`, border: `0.5px solid ${RED}40`, borderRadius: 8, fontSize: 11, color: RED, marginBottom: 12 }}>
                  ⚠️ {apiError}
                </div>
              )}

              {/* API 키 입력 폼 */}
              {showApiForm && (
                <>
                  {/* 발급 안내 링크 */}
                  <div
                    onClick={() => window.open("https://www.binance.com/ko/support/faq/api", "_blank")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", marginBottom: 16 }}
                  >
                    <div style={{ fontSize: 16 }}>📖</div>
                    <div>
                      <div style={{ fontSize: 11, color: TEXT_PRI }}>API 키 발급 방법</div>
                      <div style={{ fontSize: 10, color: BLUE_LT }}>바이낸스 가이드 보기 →</div>
                    </div>
                  </div>

                  <Field label="API KEY"    value={apiKey}    onChange={setApiKey}    type="text"     placeholder="발급받은 API Key" />
                  <Field label="SECRET KEY" value={secretKey} onChange={setSecretKey} type="password" placeholder="Secret Key 입력" />

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: TEXT_HINT, marginTop: 5, flexShrink: 0 }}/>
                    <div style={{ fontSize: 10, color: TEXT_HINT, lineHeight: 1.6 }}>
                      AES-256으로 암호화 저장 · 출금 권한 없이 거래만 가능
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={apiSaving}
                      style={{ flex: 1, padding: "11px", background: BLUE, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, cursor: apiSaving ? "not-allowed" : "pointer", opacity: apiSaving ? 0.7 : 1 }}
                    >
                      {apiSaving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={() => { setShowApiForm(false); setApiError(""); setApiKey(""); setSecretKey("") }}
                      style={{ flex: 1, padding: "11px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 8, color: TEXT_MUT, fontSize: 11, cursor: "pointer" }}
                    >
                      취소
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 계정 정보 */}
            <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRI, marginBottom: 12 }}>계정 정보</div>
              {user && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 4 }}>이메일</div>
                  <div style={{ fontSize: 13, color: TEXT_PRI }}>{user.email}</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                style={{ width: "100%", padding: "10px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 8, color: TEXT_MUT, fontSize: 11, cursor: "pointer" }}
              >
                로그아웃
              </button>
            </div>

            {/* 문의 */}
            <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRI, marginBottom: 12 }}>문의 및 지원</div>
              {[
                { label: "이메일", value: "support@quanter.io" },
                { label: "카카오뱅크", value: "구매 문의 후 안내" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${BORDER}` }}>
                  <span style={{ fontSize: 11, color: TEXT_MUT }}>{label}</span>
                  <span style={{ fontSize: 11, color: TEXT_PRI }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 10, color: TEXT_HINT, marginTop: 20 }}>
              QUANTER v1.0.0
            </div>
          </>
        )}
      </div>

      <DynamicNavBar active="account" />
    </div>
  )
}
