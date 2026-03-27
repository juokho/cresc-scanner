import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase, fetchUserSubscription } from "../supabase"
import { NavBar } from "./Home"

const BLUE     = "#3B5BDB"
const BLUE_LT  = "#4C6EF5"
const BG       = "#080c10"
const SURFACE  = "#0d1218"
const BORDER   = "#1c2530"
const TEXT_PRI = "#e2e8f0"
const TEXT_MUT = "#4a5568"
const TEXT_HINT= "#2a3545"
const GREEN    = "#22c55e"
const RED      = "#ef4444"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

function Header({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
      {onBack && (
        <div onClick={onBack} style={{ cursor: "pointer", padding: "4px 4px 4px 0" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>
        {title}
      </span>
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
      marginBottom: 32, transition: "background .2s"
    }}>
      {loading ? "저장 중..." : label}
    </button>
  )
}

function InputField({ label, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, letterSpacing: "1px" }}>{label}</div>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
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
// 메인
// ============================================================
export default function Account() {
  const [screen, setScreen] = useState("main")
  const [subscription, setSubscription] = useState({
    plan_type: "free",
    status: "active",
    features: ["basic_trading", "3_symbols", "manual_control"]
  })
  const navigate = useNavigate()

  // 구독 정보 로드
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const sub = await fetchUserSubscription()
        if (sub) {
          setSubscription(sub)
        }
      } catch (error) {
        console.error("구독 정보 로드 실패:", error)
      }
    }
    loadSubscription()
  }, [])

  if (screen === "profile")      return <ProfileEdit   onBack={() => setScreen("main")}/>
  if (screen === "api")          return <ApiKeyScreen  onBack={() => setScreen("main")}/>
  if (screen === "notification") return <NotifScreen   onBack={() => setScreen("main")}/>
  if (screen === "support")      return <SupportScreen onBack={() => setScreen("main")}/>

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      <div style={{ padding: "16px 18px 0", borderBottom: `0.5px solid ${BORDER}`, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px", marginBottom: 14 }}>내 계정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>

        {/* 프로필 */}
        <div onClick={() => setScreen("profile")} style={{
          display: "flex", alignItems: "center", gap: 14,
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          borderRadius: 12, padding: 16, marginBottom: 16, cursor: "pointer"
        }}>
          <div style={{
            width: 48, height: 48, background: BLUE, borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900,
            color: "white", flexShrink: 0
          }}>차</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRI, marginBottom: 3 }}>차호준</div>
            <div style={{ fontSize: 11, color: TEXT_MUT }}>chajohun@email.com</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M8 4l6 6-6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 구독 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>구독</div>
          <div style={{ background: "#0d1420", border: `0.5px solid ${subscription.plan_type === "pro" ? BLUE : BORDER}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: (subscription?.plan_type === "pro") ? BLUE_LT : TEXT_PRI, marginBottom: 3 }}>
                  {subscription?.plan_type?.toUpperCase() || "FREE"}
                </div>
                <div style={{ fontSize: 10, color: TEXT_MUT }}>
                  {subscription?.plan_type === "free" && "무료"}
                  {subscription?.plan_type === "basic" && "₩9,900 / 월"}
                  {subscription?.plan_type === "pro" && "₩54,000 / 월"}
                </div>
              </div>
              <div style={{
                background: (subscription?.plan_type === "pro") ? BLUE : "#666",
                color: "white", fontSize: 9, padding: "3px 8px", borderRadius: 4, letterSpacing: "1px"
              }}>
                {subscription?.status === "expired" ? "만료" : "활성"}
              </div>
            </div>
            {subscription?.status === "expired" && (
              <div style={{ 
                marginTop: 8, 
                padding: "8px 12px", 
                background: "#2a1a1a", 
                border: "1px solid #ef4444", 
                borderRadius: 6,
                fontSize: 10,
                color: "#ef4444",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 600 }}>
                  ⚠️ 구독 만료
                </div>
                <div style={{ fontSize: 10, lineHeight: 1.4 }}>
                  PRO 플랜이 만료되었습니다.<br/>
                  <span style={{ color: TEXT_MUT, textDecoration: "underline", cursor: "pointer" }} onClick={() => navigate("/pricing")}>
                    여기서 갱신하기
                  </span>
                </div>
              </div>
            )}
            <div style={{ height: "0.5px", background: "#1c2a40", marginBottom: 10 }}/>
            {[
              { label: "플랜", value: subscription?.plan_type?.toUpperCase() || "FREE" },
              { label: "상태", value: subscription?.status === "expired" ? "만료" : "활성" },
              { label: "예금주",     value: "차호준" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: TEXT_MUT }}>{label}</span>
                <span style={{ color: TEXT_PRI }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div onClick={() => navigate("/pricing")} style={{
                flex: 1, background: "transparent", border: `0.5px solid ${BLUE}`,
                borderRadius: 8, padding: 9, textAlign: "center",
                fontSize: 11, color: BLUE_LT, cursor: "pointer"
              }}>플랜 변경</div>
              <div onClick={() => setScreen("api")} style={{
                flex: 1, background: "transparent", border: `0.5px solid ${BORDER}`,
                borderRadius: 8, padding: 9, textAlign: "center",
                fontSize: 11, color: TEXT_MUT, cursor: "pointer"
              }}>구독 해지</div>
            </div>
          </div>
        </div>

        {/* 바이낸스 연결 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>바이낸스 연결</div>
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `0.5px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 2 }}>API 키</div>
                <div style={{ fontSize: 10, color: TEXT_MUT }}>AES-256 암호화 저장</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }}/>
                <span style={{ fontSize: 10, color: GREEN }}>연결됨</span>
              </div>
            </div>
            <div onClick={() => setScreen("api")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", cursor: "pointer" }}>
              <div style={{ fontSize: 12, color: TEXT_PRI }}>API 키 재설정</div>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M8 4l6 6-6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 내 성과 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>내 성과</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "총 수익", value: "+$5.24", color: GREEN   },
              { label: "승률",    value: "73.9%",  color: BLUE_LT },
              { label: "거래 수", value: "449",    color: TEXT_PRI },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 설정 메뉴 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>설정</div>
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px" }}>
            {[
              { label: "알림 설정",     desc: "디스코드, 푸시 알림",  onClick: () => setScreen("notification") },
              { label: "API 키 재설정", desc: "바이낸스 API 키 변경", onClick: () => setScreen("api") },
              { label: "고객 지원",     desc: "문의하기",             onClick: () => setScreen("support") },
            ].map(({ label, desc, onClick }, i, arr) => (
              <div key={label} onClick={onClick} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 0",
                borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER}` : "none",
                cursor: "pointer"
              }}>
                <div>
                  <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M8 4l6 6-6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* 로그아웃 */}
        <div onClick={async () => {
          await supabase.auth.signOut()
          navigate("/")
        }} style={{
          background: "transparent", border: `0.5px solid ${BORDER}`,
          borderRadius: 10, padding: 13, textAlign: "center",
          fontSize: 12, color: TEXT_MUT, cursor: "pointer", marginBottom: 24
        }}>
          로그아웃
        </div>

      </div>

      <NavBar navigate={navigate} active="account"/>
    </div>
  )
}

// ============================================================
// 프로필 편집
// ============================================================
function ProfileEdit({ onBack }) {
  const [name,    setName]    = useState("차호준")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await supabase.auth.updateUser({ data: { name } })
      alert("저장됐어요!")
      onBack()
    } catch (e) { alert("저장 실패: " + e.message) }
    setLoading(false)
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <Header title="프로필 편집" onBack={onBack}/>
      <div style={{ padding: "24px 18px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, background: BLUE, borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, color: "white"
          }}>차</div>
        </div>
        <InputField label="이름" type="text" placeholder="홍길동" value={name} onChange={setName}/>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 6, letterSpacing: "1px" }}>비밀번호 변경</div>
          <input type="password" placeholder="새 비밀번호" style={{
            width: "100%", background: SURFACE, border: `0.5px solid ${BORDER}`,
            borderRadius: 10, padding: "13px 14px", fontSize: 13, color: TEXT_PRI,
            fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 8
          }}/>
          <input type="password" placeholder="비밀번호 확인" style={{
            width: "100%", background: SURFACE, border: `0.5px solid ${BORDER}`,
            borderRadius: 10, padding: "13px 14px", fontSize: 13, color: TEXT_PRI,
            fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box"
          }}/>
        </div>
        <PrimaryBtn label="저장" onClick={handleSave} loading={loading}/>
      </div>
    </div>
  )
}

// ============================================================
// API 키 재설정 (서버에서 암호화)
// ============================================================
function ApiKeyScreen({ onBack }) {
  const [apiKey,  setApiKey]  = useState("")
  const [secret,  setSecret]  = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleSave = async () => {
    if (!apiKey || !secret) { setError("API 키와 Secret 키를 모두 입력해주세요"); return }
    setLoading(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요해요")

      // 서버에서 암호화 후 저장
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token || ""
      const res = await fetch(`${API_URL}/api-key/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          api_key:    apiKey,
          secret_key: secret,
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "저장 실패")
      }
      alert("API 키가 암호화되어 저장됐어요!")
      onBack()
    } catch (e) { setError(e.message || "저장에 실패했어요") }
    setLoading(false)
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <Header title="API 키 재설정" onBack={onBack}/>
      <div style={{ padding: "24px 18px" }}>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>현재 연결</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 2 }}>바이낸스 API</div>
              <div style={{ fontSize: 10, color: TEXT_MUT }}>AES-256 암호화 저장</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }}/>
              <span style={{ fontSize: 10, color: GREEN }}>정상</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRI, marginBottom: 6 }}>새 API 키 입력</div>
        <div style={{ fontSize: 12, color: TEXT_MUT, marginBottom: 20, lineHeight: 1.6 }}>새 키를 입력하면 기존 연결이 교체돼요</div>

        <InputField label="API KEY"    type="text"     placeholder="새 API Key"    value={apiKey} onChange={setApiKey}/>
        <InputField label="SECRET KEY" type="password" placeholder="새 Secret Key" value={secret} onChange={setSecret}/>

        {error && (
          <div style={{ background: "#1a0808", border: "0.5px solid #3a1010", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: RED, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "12px 0 24px" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEXT_HINT, marginTop: 5, flexShrink: 0 }}/>
          <div style={{ fontSize: 10, color: TEXT_HINT, lineHeight: 1.6 }}>
            API 키는 AES-256으로 암호화되어 저장되며<br/>출금 권한 없이 거래만 가능해요
          </div>
        </div>
        <PrimaryBtn label="교체하기" onClick={handleSave} loading={loading}/>
      </div>
    </div>
  )
}

// ============================================================
// 알림 설정
// ============================================================
function NotifToggle({ label, desc, on, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `0.5px solid ${BORDER}` }}>
      <div>
        <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
      </div>
      <div onClick={onChange} style={{
        width: 36, height: 20, background: on ? BLUE : BORDER,
        borderRadius: 10, position: "relative", cursor: "pointer",
        transition: "background .2s", flexShrink: 0
      }}>
        <div style={{
          width: 14, height: 14, background: "#fff", borderRadius: "50%",
          position: "absolute", top: 3, left: on ? 19 : 3, transition: "left .2s"
        }}/>
      </div>
    </div>
  )
}

function NotifScreen({ onBack }) {
  const [settings, setSettings] = useState({
    entry: true, exit: true, panic: true,
    discord: true, push: false, daily: true,
  })
  const toggle = key => setSettings(s => ({ ...s, [key]: !s[key] }))

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <Header title="알림 설정" onBack={onBack}/>
      <div style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>거래 알림</div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", marginBottom: 16 }}>
          <NotifToggle label="진입 알림"   desc="포지션 진입 시"    on={settings.entry}  onChange={() => toggle("entry")}/>
          <NotifToggle label="청산 알림"   desc="포지션 청산 시"    on={settings.exit}   onChange={() => toggle("exit")}/>
          <NotifToggle label="패닉셀 알림" desc="전체 청산 실행 시" on={settings.panic}  onChange={() => toggle("panic")}/>
        </div>
        <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>알림 채널</div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", marginBottom: 16 }}>
          <NotifToggle label="디스코드"  desc="웹훅으로 메시지 전송"   on={settings.discord} onChange={() => toggle("discord")}/>
          <NotifToggle label="푸시 알림" desc="앱 푸시 알림 (준비 중)" on={settings.push}    onChange={() => toggle("push")}/>
        </div>
        <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>리포트</div>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", marginBottom: 24 }}>
          <NotifToggle label="일일 리포트" desc="매일 자정 수익 요약" on={settings.daily} onChange={() => toggle("daily")}/>
        </div>
        <PrimaryBtn label="저장" onClick={onBack}/>
      </div>
    </div>
  )
}

// ============================================================
// 고객 지원
// ============================================================
function SupportScreen({ onBack }) {
  const [msg, setMsg] = useState("")
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto" }}>
      <Header title="고객 지원" onBack={onBack}/>
      <div style={{ padding: "20px 18px" }}>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", marginBottom: 20 }}>
          {[
            { label: "디스코드 커뮤니티", desc: "실시간 문의 및 공지" },
            { label: "이메일 문의",       desc: "support@crescq.io"  },
            { label: "버전 정보",         desc: "v1.0.0"             },
          ].map(({ label, desc }, i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 0",
              borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER}` : "none",
              cursor: i < 2 ? "pointer" : "default"
            }}>
              <div>
                <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 10, color: TEXT_MUT }}>{desc}</div>
              </div>
              {i < 2 && (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M8 4l6 6-6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 8 }}>빠른 문의</div>
        <textarea
          value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="문의 내용을 입력해주세요" rows={5}
          style={{
            width: "100%", background: SURFACE, border: `0.5px solid ${BORDER}`,
            borderRadius: 10, padding: "13px 14px", fontSize: 13, color: TEXT_PRI,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
            boxSizing: "border-box", resize: "none", marginBottom: 12
          }}
        />
        <PrimaryBtn label="문의 보내기" onClick={onBack}/>
      </div>
    </div>
  )
}
