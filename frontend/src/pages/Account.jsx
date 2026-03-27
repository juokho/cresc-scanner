import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { NavBar } from "./Home"
import { supabase } from "../supabase"
import { checkAuth } from "../api"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../theme'

export default function Account() {
  const [user, setUser] = useState(null)
  const [tier, setTier] = useState("free")
  const [isPremium, setIsPremium] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const auth = await checkAuth()
      setUser(auth.user)
      setTier(auth.tier || "free")
      setIsPremium(auth.is_premium || false)
      setAuthChecked(true)
    }
    loadUser()
  }, [])

  // 렌더링 디버깅
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
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
        padding: "14px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: BLUE_LT }}>CRESC</span>.ACCOUNT
        </span>
      </div>

      <div style={{ padding: "20px 18px", maxWidth: 430, margin: "0 auto" }}>
        {!authChecked ? (
          // 인증 확인 중
          <div style={{ 
            textAlign: "center", 
            padding: "40px 20px", 
            color: TEXT_HINT,
            fontSize: 13 
          }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 티어 정보 */}
        <div style={{ 
          background: SURFACE, 
          border: `0.5px solid ${BORDER}`, 
          borderRadius: 12, 
          padding: "16px",
          marginBottom: 16
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: 12
          }}>
            <span style={{ fontSize: 12, color: TEXT_MUT }}>현재 플랜</span>
            <span style={{ 
              fontSize: 11, 
              padding: "4px 10px", 
              borderRadius: 4,
              background: isPremium ? `${BLUE}33` : `${TEXT_MUT}22`,
              color: isPremium ? BLUE_LT : TEXT_MUT,
              fontWeight: 700
            }}>
              {tier.toUpperCase()}
            </span>
          </div>
          
          <div style={{ fontSize: 13, color: TEXT_PRI, marginBottom: 8 }}>
            {isPremium ? "전체 기능 사용 중" : "시그널 조회만 가능"}
          </div>
          
          {!isPremium && (
            <button
              onClick={() => navigate("/pricing")}
              style={{
                width: "100%",
                padding: "10px",
                background: BLUE,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 8
              }}
            >
              PREMIUM 업그레이드
            </button>
          )}
        </div>

        {/* 사용자 정보 */}
        <div style={{ 
          background: SURFACE, 
          border: `0.5px solid ${BORDER}`, 
          borderRadius: 12, 
          padding: "16px",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 12, fontWeight: 600 }}>
            계정 정보
          </div>
          {user && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 4 }}>이메일</div>
              <div style={{ fontSize: 13, color: TEXT_PRI }}>{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              border: `0.5px solid ${BORDER}`,
              borderRadius: 8,
              color: TEXT_MUT,
              fontSize: 11,
              cursor: "pointer"
            }}
          >
            로그아웃
          </button>
        </div>

        {/* 연락처 */}
        <div style={{ 
          background: SURFACE, 
          border: `0.5px solid ${BORDER}`, 
          borderRadius: 12, 
          padding: "16px",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: TEXT_PRI, marginBottom: 12, fontWeight: 600 }}>
            문의 및 지원
          </div>
          {[
            { label: "이메일", value: "support@cresc.io" },
            { label: "카카오뱅크", value: "구매 문의 후 안내" },
          ].map(({ label, value }) => (
            <div key={label} style={{ 
              display: "flex", 
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: `0.5px solid ${BORDER}`
            }}>
              <span style={{ fontSize: 11, color: TEXT_MUT }}>{label}</span>
              <span style={{ fontSize: 11, color: TEXT_PRI }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 버전 */}
        <div style={{ textAlign: "center", fontSize: 10, color: TEXT_HINT, marginTop: 20 }}>
          Cresc Scanner v1.0.0
        </div>
          </>
        )}
      </div>

      <NavBar navigate={navigate} active="account" />
    </div>
  )
}
