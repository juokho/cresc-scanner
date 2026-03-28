import { useState, useCallback, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { startBot, stopBot, updateBotSettings, fetchUserSubscription } from "../api"
import useBotStatus from "../hooks/useBotStatus"

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

// 스켈레톤 UI 컴포넌트
function SkeletonCard({ height = 60 }) {
  return (
    <div style={{ 
      background: SURFACE, 
      border: `0.5px solid ${BORDER}`, 
      borderRadius: 12, 
      padding: "12px 14px",
      height: height,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(90deg, transparent, ${BORDER}40, transparent)`,
        animation: "skeleton-loading 1.5s infinite"
      }}/>
      <div style={{ opacity: 0.1 }}>
        <div style={{ width: "60%", height: 12, background: TEXT_MUT, borderRadius: 4, marginBottom: 8 }}/>
        <div style={{ width: "40%", height: 16, background: TEXT_MUT, borderRadius: 4 }}/>
      </div>
    </div>
  )
}

function Toggle({ on, onChange, loading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 9, color: TEXT_MUT, letterSpacing: "1px" }}>AUTO</span>
      <div onClick={loading ? null : onChange} style={{
        width: 36, height: 20,
        background: on ? BLUE : BORDER,
        borderRadius: 10, position: "relative",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "background .2s"
      }}>
        <div style={{
          width: 14, height: 14, background: "#fff",
          borderRadius: "50%", position: "absolute",
          top: 3, left: on ? 19 : 3,
          transition: "left .2s"
        }}/>
        {on && (
          <div style={{
            position: "absolute",
            top: 6, left: 6,
            width: 8, height: 8,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.8)",
            animation: "pulse 2s infinite"
          }}/>
        )}
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, color, unit, onChange, desc }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: TEXT_PRI, fontWeight: 500 }}>{label}</div>
          {desc && <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 1 }}>{desc}</div>}
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color }}>
          {value}<span style={{ fontSize: 11, color: TEXT_MUT }}>{unit}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 4, borderRadius: 2, background: BORDER, cursor: "pointer" }}>
        <div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: color }}/>
        <input
          type="range" min={min} max={max}
          step={min === 0.5 ? 0.1 : 1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", top: -6, left: 0, width: "100%", opacity: 0, cursor: "pointer", height: 16 }}
        />
        <div style={{
          position: "absolute", top: "50%",
          left: `calc(${pct}% - 7px)`,
          transform: "translateY(-50%)",
          width: 14, height: 14,
          background: color, borderRadius: "50%",
          border: `2px solid ${BG}`, pointerEvents: "none"
        }}/>
      </div>
    </div>
  )
}

export default function Home({ leverage, setLeverage, tradePct, setTradePct, slRoi, setSlRoi, tpRoi, setTpRoi, symbolUpdating, setSymbolUpdating, saveSettings }) {
  const navigate  = useNavigate()
  const debounce  = useRef(null)
  const [togLoading, setTogLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")  // 설정 저장 메시지 상태 추가
  const [balanceHistory, setBalanceHistory] = useState([])  // 잔고 변화 기록
  const [errorMsg, setErrorMsg] = useState("")  // 에러 메시지 상태
  const [subscription, setSubscription] = useState({
    plan_type: "free",
    status: "active",
    features: ["basic_trading", "3_symbols", "manual_control"]
  })

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

  // 공유 훅으로 폴링 (Dashboard.jsx와 중복 코드 제거)
  const {
    botRunning, setBotRunning,
    connected,
    serverMsg,  setServerMsg,
    balance,
    unrealized,
    positions,
    selectedSymbols, setSelectedSymbols,
    poll,
  } = useBotStatus()

  const balNum = parseFloat(String(balance).replace(/[$,]/g, "")) || 0

  // 잔고 변화율 계산
  useEffect(() => {
    if (balNum > 0) {
      setBalanceHistory(prev => {
        const newHistory = [...prev, balNum].slice(-10) // 최근 10개 기록
        return newHistory
      })
    }
  }, [balNum])

  const balanceChange = balanceHistory.length >= 2 
    ? ((balNum - balanceHistory[0]) / balanceHistory[0] * 100)
    : 0

  // 설정 동기화 (디바운스 800ms)
  const syncSettings = useCallback(async (settings) => {
    if (!botRunning) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        await updateBotSettings(settings)
        await saveSettings()  // 사용자 설정 저장
        setSaveMsg("✓ 설정 반영됨")
        setTimeout(() => setSaveMsg(""), 2000)
      } catch {
        setSaveMsg("설정 반영 실패")
        setTimeout(() => setSaveMsg(""), 2000)
      }
    }, 800)
  }, [botRunning, saveSettings])

  const makeSettings = (overrides) => ({
    leverage, tradePct, slAtrMult: slRoi, tpAtrMult: tpRoi,
    selected_symbols: selectedSymbols, ...overrides,
  })

  const handleLeverage = (v) => { setLeverage(v); syncSettings(makeSettings({ leverage: v })) }
  const handleTradePct = (v) => { setTradePct(v); syncSettings(makeSettings({ tradePct: v })) }
  const handleSlRoi    = (v) => { setSlRoi(v);    syncSettings(makeSettings({ slAtrMult: v })) }
  const handleTpRoi    = (v) => { setTpRoi(v);    syncSettings(makeSettings({ tpAtrMult: v })) }

  const toggleSymbol = async (sym) => {
    if (symbolUpdating) return  // 중복 클릭 방지
    
    // 플랜별 심볼 제한
    const maxSymbols = {
      "free": 3,
      "basic": 5,
      "pro": 999,
      "elite": 999
    }[subscription.plan_type] || 3
    
    if (!selectedSymbols.includes(sym) && selectedSymbols.length >= maxSymbols) {
      setErrorMsg(`${subscription.plan_type.toUpperCase()} 플랜은 최대 ${maxSymbols}개 심볼만 선택 가능합니다`)
      setTimeout(() => setErrorMsg(""), 3000)
      return
    }
    
    const next = selectedSymbols.includes(sym)
      ? selectedSymbols.filter(s => s !== sym)
      : [...selectedSymbols, sym]
    if (next.length === 0) {
      setErrorMsg("최소 1개 이상의 심볼을 선택해야 합니다")
      setTimeout(() => setErrorMsg(""), 3000)
      return
    }
    
    setSymbolUpdating(true)
    setSelectedSymbols(next)
    
    try {
      await syncSettings(makeSettings({ selected_symbols: next }))
    } catch (e) {
      // 실패 시 원래대로 복원
      setSelectedSymbols(selectedSymbols)
      const friendlyMsg = getErrorMessage(e)
      setErrorMsg(friendlyMsg)
      setTimeout(() => setErrorMsg(""), 3000)
    } finally {
      setSymbolUpdating(false)
    }
  }

  // 에러 메시지 변환 함수
  const getErrorMessage = (error) => {
    const message = error?.message || error?.toString() || "알 수 없는 오류"
    
    if (message.includes("400") || message.includes("Bad Request")) {
      return "요청이 잘못되었습니다. 설정값을 확인해주세요"
    } else if (message.includes("401") || message.includes("Unauthorized")) {
      return "인증이 필요합니다. 다시 로그인해주세요"
    } else if (message.includes("403") || message.includes("Forbidden")) {
      return "권한이 없습니다"
    } else if (message.includes("404") || message.includes("Not Found")) {
      return "서비스를 찾을 수 없습니다"
    } else if (message.includes("500") || message.includes("Internal Server Error")) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
    } else if (message.includes("timeout") || message.includes("TIMEOUT")) {
      return "요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요"
    } else if (message.includes("network") || message.includes("Network")) {
      return "네트워크 연결에 문제가 있습니다"
    } else {
      return "오류가 발생했습니다: " + message
    }
  }

  const handleToggle = async () => {
    if (!connected || togLoading) return
    setTogLoading(true)
    try {
      if (botRunning) {
        await stopBot()
        setBotRunning(false)
        setServerMsg("자동매매 정지")
      } else {
        await startBot({
          leverage, trade_pct: tradePct / 100,
          sl_atr_mult: slRoi, tp_atr_mult: tpRoi,
          selected_symbols: selectedSymbols, sl_mode: "atr",
        })
        setBotRunning(true)
        setServerMsg("자동매매 실행 중")
      }
    } catch (e) {
      const friendlyMsg = getErrorMessage(e)
      setErrorMsg(friendlyMsg)
      setTimeout(() => setErrorMsg(""), 3000)
    } finally {
      setTogLoading(false)
      await poll()
    }
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={26}/>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: TEXT_PRI, letterSpacing: "1px" }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>.TRADING
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle on={botRunning} onChange={handleToggle} loading={togLoading}/>
          <svg onClick={() => navigate("/account")} width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ cursor: "pointer" }}>
            <circle cx="10" cy="7" r="3" stroke={TEXT_MUT} strokeWidth="1.5"/>
            <path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={TEXT_MUT} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* 구독 만료 메시지 */}
      {subscription.status === "expired" && (
        <div style={{ 
          marginTop: 8, 
          padding: "10px 12px", 
          background: "#2a1a1a", 
          border: "1px solid #ef4444", 
          borderRadius: 8,
          fontSize: 11,
          color: "#ef4444",
          textAlign: "center",
          marginBottom: 16
        }}>
          <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
            ⚠️ 구독 만료
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.4 }}>
            PRO 플랜이 2025년 3월 25일에 만료되었습니다.<br/>
            <span style={{ color: TEXT_MUT, textDecoration: "underline", cursor: "pointer" }} onClick={() => navigate("/pricing")}>
              여기서 갱신하기
            </span>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMsg && (
        <div style={{ 
          margin: "8px 18px 0", 
          padding: "8px 12px", 
          background: "#2a1a1a", 
          border: "0.5px solid #ef444440", 
          borderRadius: 8, 
          fontSize: 10, 
          color: RED, 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          animation: "slideIn 0.3s ease"
        }}>
          <div style={{ 
            width: 4, 
            height: 4, 
            borderRadius: "50%", 
            background: RED 
          }}/>
          {errorMsg}
        </div>
      )}

      {/* 서버 상태 */}
      {serverMsg && (
        <div style={{ 
          margin: "8px 18px 0", 
          padding: "6px 12px", 
          background: SURFACE, 
          border: `0.5px solid ${!connected ? RED : botRunning ? GREEN : BORDER}`, 
          borderRadius: 8, 
          fontSize: 10, 
          color: !connected ? RED : botRunning ? GREEN : TEXT_HINT, 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          position: "relative"
        }}>
          <div style={{ 
            width: 5, 
            height: 5, 
            borderRadius: "50%", 
            background: !connected ? RED : botRunning ? GREEN : TEXT_HINT,
            ...(botRunning && {
              animation: "pulse 2s infinite",
              boxShadow: `0 0 8px ${GREEN}40`
            })
          }}/>
          {serverMsg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 잔고/PNL */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { 
              label: "Balance", 
              value: balance, 
              color: TEXT_PRI,
              change: balanceChange !== 0 ? `${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(2)}%` : null,
              changeColor: balanceChange >= 0 ? GREEN : RED
            },
            { 
              label: "미실현 PNL", 
              value: unrealized, 
              color: unrealized.startsWith("+") ? GREEN : unrealized === "--" ? TEXT_PRI : RED,
              change: unrealized !== "--" && positions.length > 0 ? `${positions.length} pos` : null,
              changeColor: TEXT_MUT
            },
          ].map(({ label, value, color, change, changeColor }) => (
            <div key={label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "12px 10px" }}>
              <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color }}>{value}</div>
              {change && (
                <div style={{ fontSize: 9, color: changeColor, marginTop: 2, fontWeight: 600 }}>
                  {change}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 종목 선택 */}
        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>ASSETS TO SCAN</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["BTCUSDT", "ETHUSDT", "SOLUSDT"].map(sym => (
              <div 
                key={sym} 
                onClick={() => toggleSymbol(sym)} 
                style={{ 
                  flex: 1, 
                  padding: "16px 0",  // 12px -> 16px로 증가
                  minHeight: 48,      // 최소 높이 48px 보장
                  borderRadius: 12,    // 10 -> 12로 증가
                  textAlign: "center", 
                  fontSize: 12,        // 11 -> 12로 증가
                  fontWeight: 700, 
                  cursor: symbolUpdating ? "not-allowed" : "pointer",
                  background: selectedSymbols.includes(sym) ? BLUE : SURFACE, 
                  border: `1.5px solid ${selectedSymbols.includes(sym) ? BLUE_LT : BORDER}`,  // 1px -> 1.5px
                  color: selectedSymbols.includes(sym) ? "#fff" : TEXT_MUT,
                  opacity: symbolUpdating ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  position: "relative",
                  userSelect: "none"    // 텍스트 선택 방지
                }}
              >
                {sym.replace("USDT", "")}
              </div>
            ))}
          </div>
        </div>

        {/* 포지션 */}
        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 8 }}>POSITIONS</div>
          {!connected ? (
            <SkeletonCard height={80} />
          ) : positions.length === 0 ? (
            <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "20px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: TEXT_HINT }}>활성 포지션 없음</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {positions.map((pos, i) => (
                <div key={i} style={{ background: SURFACE, border: `0.5px solid ${pos.pnl >= 0 ? "#1a3a2a" : "#3a1a1a"}`, borderRadius: 12, padding: "13px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700 }}>{pos.symbol}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: pos.side === "LONG" ? "#1a3a2a" : "#3a1a1a", color: pos.side === "LONG" ? GREEN : RED, fontSize: 10, padding: "3px 8px", borderRadius: 4 }}>{pos.side}</span>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: pos.pnl >= 0 ? GREEN : RED }}>
                        {pos.pnl >= 0 ? "+" : "-"}${Math.abs(pos.pnl).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[
                      { label: "진입가", value: `$${pos.entry.toLocaleString()}` },
                      { label: "Price",  value: `$${pos.mark.toLocaleString()}` },
                      { label: "ROE",    value: <span style={{ color: pos.roe >= 0 ? GREEN : RED }}>{pos.roe.toFixed(2)}%</span> },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {/* 포지션 정리 버튼 */}
                  <div style={{ 
                    marginTop: 8, 
                    paddingTop: 8, 
                    borderTop: `0.5px solid ${BORDER}`,
                    display: "flex",
                    justifyContent: "center"
                  }}>
                    <button
                      onClick={async () => {
                        if (window.confirm(`${pos.symbol} 포지션을 정리하시겠습니까?`)) {
                          try {
                            // TODO: 포지션 청산 API 호출 필요
                            setServerMsg(`${pos.symbol} 포지션 정리 요청됨`)
                            setTimeout(() => setServerMsg(""), 3000)
                          } catch (e) {
                            const friendlyMsg = getErrorMessage(e)
                            setErrorMsg(friendlyMsg)
                            setTimeout(() => setErrorMsg(""), 3000)
                          }
                        }
                      }}
                      style={{
                        background: pos.side === "LONG" ? "#1a3a2a" : "#3a1a1a",
                        border: `1px solid ${pos.side === "LONG" ? GREEN : RED}40`,
                        borderRadius: 6,
                        padding: "8px 16px",
                        fontSize: 10,
                        fontWeight: 600,
                        color: pos.side === "LONG" ? GREEN : RED,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        width: "100%",
                        textAlign: "center"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = pos.side === "LONG" ? "#1a3a2a80" : "#3a1a1a80"
                        e.target.style.borderColor = pos.side === "LONG" ? GREEN : RED
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = pos.side === "LONG" ? "#1a3a2a" : "#3a1a1a"
                        e.target.style.borderColor = `${pos.side === "LONG" ? GREEN : RED}40`
                      }}
                    >
                      Close Position
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px" }}>CONTROLS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {saveMsg && <div style={{ fontSize: 10, color: GREEN }}>{saveMsg}</div>}
              <div style={{
                background: subscription.plan_type === "basic" ? "#22c55e" : subscription.plan_type === "pro" ? "#8b5cf6" : subscription.plan_type === "elite" ? "#f59e0b" : "#666",
                color: "#fff",
                fontSize: 8,
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 600,
                letterSpacing: "0.5px"
              }}>
                {subscription.plan_type.toUpperCase()}
                {subscription.status === "expired" && " (만료)"}
              </div>
            </div>
          </div>
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
            <SliderRow label="레버리지"    desc="수익/손실 증폭"                         value={leverage} min={1}   max={125} color={BLUE_LT} unit="x" onChange={handleLeverage}/>
            <SliderRow label="진입 사이즈" desc={`약 $${(balNum * tradePct / 100).toFixed(2)} 투입`} value={tradePct} min={1} max={100} color={BLUE_LT} unit="%" onChange={handleTradePct}/>
            <SliderRow label="손절 ATR 배수" desc="entry ± ATR×N 에서 손절"              value={slRoi}    min={0.5} max={5}   color={RED}    unit="x" onChange={handleSlRoi}/>
            <SliderRow label="익절 ATR 배수" desc="entry ± ATR×N 에서 익절"              value={tpRoi}    min={0.5} max={10}  color={GREEN}  unit="x" onChange={handleTpRoi}/>
          </div>
        </div>

        {/* 패닉 버튼 */}
        <div
          onClick={async () => {
            if (window.confirm("정말 봇을 정지할까요? (포지션은 유지됩니다)")) {
              try {
                await stopBot()
                setBotRunning(false)
                setServerMsg("봇 정지 완료")
              } catch (e) { 
                const friendlyMsg = getErrorMessage(e)
                setErrorMsg(friendlyMsg)
                setTimeout(() => setErrorMsg(""), 3000)
              }
            }
          }}
          style={{ 
            background: "#0d0606", 
            border: "0.5px solid #2a1010", 
            borderRadius: 12, 
            padding: "18px 14px",  // 14px -> 18px로 증가
            minHeight: 52,         // 최소 높이 52px 보장
            fontFamily: "'Orbitron', sans-serif", 
            fontSize: 11,           // 10 -> 11로 증가
            fontWeight: 700, 
            color: RED, 
            letterSpacing: "2px", 
            textAlign: "center", 
            cursor: "pointer", 
            marginBottom: 24,
            transition: "all 0.2s ease",
            userSelect: "none"
          }}
        >
          PANIC STOP — 봇 정지
        </div>
      </div>

      <NavBar navigate={navigate} active="home"/>
    </div>
  )
}

export function NavBar({ navigate, active }) {
  const items = [
    { id: "home",    label: "홈",      path: "/dashboard", icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke={c} strokeWidth="1.5"/><path d="M7 18v-7h6v7" stroke={c} strokeWidth="1.5"/></svg> },
    { id: "monitor", label: "모니터링", path: "/monitor",   icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="10" width="4" height="8" rx="1" fill={c}/><rect x="8" y="6" width="4" height="12" rx="1" fill={c}/><rect x="14" y="2" width="4" height="16" rx="1" fill={c}/></svg> },
    { id: "history", label: "내역",    path: "/history",   icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5"/><path d="M10 7v3l2 2" stroke={c} strokeWidth="1.5"/></svg> },
    { id: "account", label: "내 계정", path: "/account",   icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke={c} strokeWidth="1.5"/><path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={c} strokeWidth="1.5"/></svg> },
  ]
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "18px 20px 36px", borderTop: `0.5px solid ${BORDER}`, background: BG }}>
      {items.map(item => {
        const isActive = active === item.id
        const color    = isActive ? BLUE_LT : TEXT_HINT
        return (
          <div 
            key={item.id} 
            onClick={() => navigate(item.path)} 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 6,  // 4 -> 6으로 증가
              cursor: "pointer",
              padding: "8px 12px",  // 패딩 추가
              borderRadius: 8,       // 둥근 모서리 추가
              minHeight: 56,         // 최소 높이 56px 보장
              transition: "all 0.2s ease",
              background: isActive ? `${BLUE_LT}15` : "transparent",  // 활성 상태 배경
              userSelect: "none"
            }}
          >
            {item.icon(color)}
            <span style={{ fontSize: 10, color, letterSpacing: "1px", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
