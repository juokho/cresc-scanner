import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { fetchSignals, fetchTrades, checkAuth, getApiKey, getTier, triggerScan } from "../../api"
import { StockNavBar } from "../../components/NavBar"
import { supabase } from "../../supabase"
import { BLUE, BLUE_LT, BG, SURFACE, BORDER, TEXT_PRI, TEXT_MUT, TEXT_HINT, GREEN, RED, AMBER, SILVER, GOLD } from '../../theme'

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

// 스켈레톤 UI
function SkeletonCard({ height = 80 }) {
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
        top: 0, left: 0, right: 0, bottom: 0,
        background: `linear-gradient(90deg, transparent, ${BORDER}40, transparent)`,
        animation: "skeleton-loading 1.5s infinite"
      }}/>
    </div>
  )
}

// 시그널 뱃지
function SignalBadge({ signal }) {
  const colors = {
    LONG: { bg: "#1a3a2a", text: GREEN, label: "LONG" },
    SHORT: { bg: "#3a1a1a", text: RED, label: "SHORT" },
    WAIT: { bg: SURFACE, text: TEXT_MUT, label: "WAIT" }
  }
  const { bg, text, label } = colors[signal] || colors.WAIT
  
  return (
    <span style={{
      background: bg,
      color: text,
      fontSize: 9,
      padding: "2px 8px",
      borderRadius: 4,
      fontWeight: 700,
      letterSpacing: "0.5px"
    }}>
      {label}
    </span>
  )
}

// 시그널 카드
function SignalCard({ signal, isPremium }) {
  const { symbol, name, signal: sig, score, ci, z, regime, long_t, short_t } = signal
  const isLong = sig === "LONG"
  const isShort = sig === "SHORT"
  
  const scoreColor = isLong ? GREEN : isShort ? RED : TEXT_MUT
  const scoreFmt = score > 0 ? `+${score}` : score
  
  // 레버리지 ETF 티커만 표시 (신호 방향에 따라)
  const leverageTicker = isLong ? long_t : isShort ? short_t : null
  const leverageName = isLong ? "3X Long" : isShort ? "3X Short" : null
  
  // 티커를 레버리지 ETF로 교체
  const displayTicker = leverageTicker || symbol
  
  return (
    <div style={{
      background: SURFACE,
      border: `0.5px solid ${isLong ? GREEN : isShort ? RED : BORDER}`,
      borderRadius: 12,
      padding: "14px",
      position: "relative"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>
            {displayTicker}
          </div>
          <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{name}</div>
        </div>
        <SignalBadge signal={sig} />
      </div>
      
      <div style={{ 
        fontFamily: "'Orbitron', sans-serif", 
        fontSize: 20, 
        fontWeight: 900, 
        color: scoreColor,
        margin: "8px 0"
      }}>
        {scoreFmt}
      </div>
      
      {/* 레버리지 배지 */}
      {leverageTicker && (
        <div style={{
          marginTop: 8,
          padding: "6px 10px",
          background: isLong ? `${GREEN}15` : `${RED}15`,
          borderRadius: 6,
          border: `0.5px solid ${isLong ? GREEN : RED}`,
          display: "inline-block"
        }}>
          <div style={{ fontSize: 9, color: TEXT_MUT }}>{leverageName}</div>
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT_MUT, marginTop: 8 }}>
        <span>CI: {ci}</span>
        <span>Z: {z}</span>
        <span>{regime}</span>
      </div>
    </div>
  )
}

// 포지션 카드 (수익률 표시)
function PositionCard({ signal }) {
  const { symbol, name, price, signal: sig, position } = signal
  const isLong = sig === "LONG"
  
  // 수익률 계산
  const profit = position ? ((price - position.entry) / position.entry * 100 * (isLong ? 1 : -1)) : 0
  const profitColor = profit >= 0 ? GREEN : RED
  const profitFmt = profit >= 0 ? `+${profit.toFixed(2)}%` : `${profit.toFixed(2)}%`
  
  // 진입 시간 (포지션 객체에서 또는 현재 시간)
  const entryTime = position?.entry_time || "--:--"
  
  return (
    <div style={{
      background: SURFACE,
      border: `0.5px solid ${profit >= 0 ? GREEN : RED}`,
      borderRadius: 12,
      padding: "14px",
      position: "relative"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>
            {symbol}
          </div>
          <div style={{ fontSize: 10, color: TEXT_MUT, marginTop: 2 }}>{name}</div>
        </div>
        <span style={{
          fontSize: 9,
          padding: "2px 8px",
          borderRadius: 4,
          background: isLong ? `${GREEN}22` : `${RED}22`,
          color: isLong ? GREEN : RED,
          fontWeight: 700
        }}>
          {isLong ? "LONG" : "SHORT"}
        </span>
      </div>
      
      {/* 수익률 표시 */}
      <div style={{ 
        fontFamily: "'Orbitron', sans-serif", 
        fontSize: 24, 
        fontWeight: 900, 
        color: profitColor,
        margin: "12px 0"
      }}>
        {profitFmt}
      </div>
      
      {/* 진입가/현재가 */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_MUT, marginBottom: 8 }}>
        <span>진입: ${position?.entry?.toFixed(2) || "--"}</span>
        <span>현재: ${price?.toFixed(2) || "--"}</span>
      </div>
      
      {/* 진입 시간 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 6,
        fontSize: 10, 
        color: TEXT_HINT,
        paddingTop: 8,
        borderTop: `0.5px solid ${BORDER}`
      }}>
        <span>🕐 {entryTime}</span>
      </div>
      
      {/* 손절가/익절가 */}
      <div style={{ 
        marginTop: 10, 
        display: "flex", 
        justifyContent: "space-between",
        fontSize: 10
      }}>
        <span style={{ color: RED }}>SL: ${position?.sl?.toFixed(2) || "--"}</span>
        <span style={{ color: GREEN }}>TP: ${position?.tp?.toFixed(2) || "--"}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [tier, setTierState] = useState("free")
  const [authChecked, setAuthChecked] = useState(false) // 인증 확인 완료 여부
  const [scanState, setScanState] = useState({})
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const [activeTab, setActiveTab] = useState("signals")
  const [timeframe, setTimeframe] = useState("5m")
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const [filter, setFilter] = useState("all")
  const [watchlistExpanded, setWatchlistExpanded] = useState(false)
  const [hoveredTicker, setHoveredTicker] = useState(null) // hover 중인 티커
  const [user, setUser] = useState(null)
  const pollRef = useRef(null)

  // 초기 로드 - checkAuth로 tier 확인
  useEffect(() => {
    const init = async () => {
      const auth = await checkAuth()
      setUser(auth.user)
      setTierState(auth.tier)
      setIsPremium(auth.is_premium)
      setApiKeyInput(auth.api_key || "")
      setAuthChecked(true) // 인증 확인 완료
    }
    init()
  }, [])

  // 데이터 폴링
  const fetchData = useCallback(async (tf = timeframe) => {
    try {
      setError(null)
      const currentApiKey = getApiKey()
      console.log("fetchData - timeframe:", tf, "API key:", currentApiKey)
      const data = await fetchSignals(tf)
      console.log("fetchSignals response:", data)
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      setSignals(data.signals || [])
      setScanState(data.scan || {})
      // 티어는 checkAuth에서 설정한 값 유지 (백엔드 응답으로 덮어쓰지 않음)
      // setTierState(data.tier || "free")
      // setIsPremium(data.tier === "premium")
      setLastUpdate(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      
      // Premium 기능은 이미 알고 있는 tier 상태로 확인
      if (tier === "premium" && tf === "5m") {
        const tradesData = await fetchTrades()
        if (!tradesData.error) {
          setTrades(tradesData || [])
        }
      }
    } catch (e) {
      setError("서버 연결 실패")
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  // 데이터 폴링 시작
  useEffect(() => {
    fetchData()
    pollRef.current = setInterval(fetchData, 10000)
    return () => clearInterval(pollRef.current)
  }, [fetchData])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  // 필터링
  const filteredSignals = signals.filter(s => {
    if (filter === "all") return true
    if (filter === "active") return s.signal !== "WAIT"
    if (filter === "long") return s.signal === "LONG"
    if (filter === "short") return s.signal === "SHORT"
    if (filter === "trend") return s.regime === "TREND"
    if (filter === "range") return s.regime === "RANGE"
    return true
  })

  const activeSignals = filteredSignals.filter(s => s.signal !== "WAIT")
  const waitSignals = filteredSignals.filter(s => s.signal === "WAIT")

  return (
    <div style={{ 
      background: BG, 
      minHeight: "100vh", 
      fontFamily: "'DM Sans', sans-serif", 
      color: TEXT_PRI,
      paddingBottom: 100,
      maxWidth: 430,
      margin: "0 auto"
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "14px 18px",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        background: BG,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={28} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>
          </span>
          {authChecked && (
            <span style={{
              fontSize: 9,
              padding: "2px 6px",
              borderRadius: 4,
              background: isPremium ? `${BLUE}33` : `${TEXT_MUT}22`,
              color: isPremium ? BLUE_LT : TEXT_MUT,
              fontWeight: 700,
              letterSpacing: "0.5px"
            }}>
              {tier.toUpperCase()}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!authChecked ? (
            // 인증 확인 중
            <span style={{ fontSize: 11, color: TEXT_HINT }}>...</span>
          ) : user ? (
            <button
              onClick={() => navigate('/account')}
              style={{
                background: "transparent",
                border: `0.5px solid ${isPremium ? BLUE : BORDER}`,
                borderRadius: 6,
                padding: "6px 12px",
                color: isPremium ? BLUE_LT : TEXT_PRI,
                fontSize: 11,
                cursor: "pointer"
              }}
            >
              내 계정
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: "transparent",
                  border: "none",
                  color: TEXT_MUT,
                  fontSize: 11,
                  cursor: "pointer"
                }}
              >
                로그인
              </button>
              <span style={{ color: TEXT_HINT }}>|</span>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background: BLUE,
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  color: "#fff",
                  fontSize: 11,
                  cursor: "pointer"
                }}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      {/* 에러 알림 */}
      {error && (
        <div style={{
          background: `${RED}22`,
          border: `0.5px solid ${RED}`,
          borderRadius: 8,
          padding: "10px 14px",
          margin: "8px 18px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ color: RED, fontSize: 12 }}>⚠️</span>
          <span style={{ color: RED, fontSize: 11 }}>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: RED,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 스캔 상태 및 마지막 업데이트 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 18px",
        borderBottom: `0.5px solid ${BORDER}`,
        fontSize: 10,
        color: TEXT_MUT
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scanState.running ? (
            <>
              <span style={{ color: BLUE }}>⏳ 스캔 중...</span>
              <span>({scanState.progress || 0}%)</span>
              <span style={{ color: TEXT_HINT }}>{scanState.current || ""}</span>
            </>
          ) : (
            <>
              <span style={{ color: GREEN }}>✓ 스캔 완료</span>
              {scanState.last_scan && <span style={{ color: TEXT_HINT }}>{scanState.last_scan}</span>}
            </>
          )}
        </div>
        {lastUpdate && (
          <span style={{ color: TEXT_HINT }}>업데이트: {lastUpdate}</span>
        )}
      </div>

      {/* 통계 카드 */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        padding: "12px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        {[
          { label: "TOTAL",  value: signals.length,                                  color: TEXT_PRI },
          { label: "ACTIVE", value: activeSignals.length,                             color: GREEN },
          { label: "LONG",   value: signals.filter(s => s.signal === "LONG").length,  color: GREEN },
          { label: "SHORT",  value: signals.filter(s => s.signal === "SHORT").length, color: RED },
        ].map(stat => (
          <div key={stat.label} style={{ 
            flex: 1, 
            background: SURFACE,
            border: `0.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: "10px 6px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 8, color: TEXT_HINT, marginBottom: 4, letterSpacing: "0.8px" }}>{stat.label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ 
        display: "flex", 
        gap: 4, 
        padding: "12px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        {!authChecked ? (
          // 인증 확인 중 - 로딩 표시
          <div style={{ 
            flex: 1, 
            textAlign: "center", 
            padding: "8px", 
            fontSize: 11, 
            color: TEXT_HINT 
          }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 시그널 탭 + 시간봉 선택 */}
            <div style={{ flex: 1, position: "relative" }}>
              <button
                onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: activeTab === "signals" ? `${BLUE}20` : "transparent",
                  border: `0.5px solid ${activeTab === "signals" ? BLUE : "transparent"}`,
                  borderRadius: 8,
                  color: activeTab === "signals" ? BLUE_LT : TEXT_MUT,
                  fontSize: 11,
                  fontWeight: activeTab === "signals" ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5
                }}
              >
                📡 시그널 ({timeframe === "5m" ? "5m" : timeframe === "30m" ? "30m" : timeframe === "1h" ? "1h" : "1D"})
                <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
              </button>
              
              {/* 시간봉 선택 메뉴 */}
              {showTimeframeMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: SURFACE,
                  border: `0.5px solid ${BORDER}`,
                  borderRadius: 6,
                  marginTop: 4,
                  zIndex: 100,
                  padding: "4px"
                }}>
                  {[
                    { id: "5m", label: "5분" },
                    { id: "30m", label: "30분" },
                    { id: "1h", label: "1시간" },
                    { id: "1d", label: "일봉" },
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={async () => {
                        setTimeframe(tf.id)
                        setShowTimeframeMenu(false)
                        setActiveTab("signals")
                        setLoading(true)
                        // 온디맨드 스캔 트리거
                        if (tf.id !== "5m") {
                          await triggerScan(tf.id)
                        }
                        await fetchData(tf.id)
                        setLoading(false)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: timeframe === tf.id ? `${BLUE}22` : "transparent",
                        border: "none",
                        borderRadius: 4,
                        color: timeframe === tf.id ? BLUE_LT : TEXT_PRI,
                        fontSize: 11,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 포지션 탭 */}
            <button
              onClick={() => setActiveTab("positions")}
              disabled={!isPremium}
              style={{
                flex: 1,
                padding: "9px 12px",
                background: activeTab === "positions" ? `${BLUE}20` : "transparent",
                border: `0.5px solid ${activeTab === "positions" ? BLUE : "transparent"}`,
                borderRadius: 8,
                color: !isPremium ? TEXT_HINT : activeTab === "positions" ? BLUE_LT : TEXT_MUT,
                fontSize: 11,
                fontWeight: activeTab === "positions" ? 700 : 500,
                cursor: !isPremium ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4
              }}
            >
              📊 포지션
              {!isPremium && <span style={{ fontSize: 8 }}>🔒</span>}
            </button>
            
            {/* 내역 탭 */}
            <button
              onClick={() => setActiveTab("history")}
              disabled={!isPremium}
              style={{
                flex: 1,
                padding: "9px 12px",
                background: activeTab === "history" ? `${BLUE}20` : "transparent",
                border: `0.5px solid ${activeTab === "history" ? BLUE : "transparent"}`,
                borderRadius: 8,
                color: !isPremium ? TEXT_HINT : activeTab === "history" ? BLUE_LT : TEXT_MUT,
                fontSize: 11,
                fontWeight: activeTab === "history" ? 700 : 500,
                cursor: !isPremium ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4
              }}
            >
              📋 내역
              {!isPremium && <span style={{ fontSize: 8 }}>🔒</span>}
            </button>
          </>
        )}
      </div>

      {/* 컨텐츠 */}
      <div style={{ padding: "16px 18px" }}>
        {/* 로딩 상태 */}
        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12 }}>데이터 로딩 중...</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={100} />)}
            </div>
          </div>
        )}
        
        {!loading && activeTab === "signals" && (
          <>
            {/* 필터 - 가로 스크롤 */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 16,
              overflowX: "auto", paddingBottom: 4,
              scrollbarWidth: "none", msOverflowStyle: "none"
            }}>
              {[
                { id: "all",   label: "전체" },
                { id: "active", label: "🔥 ACTIVE" },
                { id: "long",  label: "▲ LONG" },
                { id: "short", label: "▼ SHORT" },
                { id: "trend", label: "📈 TREND" },
                { id: "range", label: "↔ RANGE" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 14px",
                    background: filter === f.id ? BLUE : SURFACE,
                    border: `0.5px solid ${filter === f.id ? BLUE : BORDER}`,
                    borderRadius: 20,
                    color: filter === f.id ? "#fff" : TEXT_MUT,
                    fontSize: 10,
                    fontWeight: filter === f.id ? 700 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Active Signals */}
            {activeSignals.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px" }}>
                  ACTIVE SIGNALS ({activeSignals.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
                  {activeSignals.map(s => (
                    <SignalCard key={s.symbol} signal={s} isPremium={isPremium} />
                  ))}
                </div>
              </>
            )}

            {/* Watchlist - 접기/펼치기 */}
            <div 
              onClick={() => setWatchlistExpanded(!watchlistExpanded)}
              style={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                padding: "8px 0",
                marginBottom: watchlistExpanded ? 12 : 0,
                borderBottom: `0.5px solid ${BORDER}`
              }}
            >
              <div style={{ fontSize: 11, color: TEXT_MUT, fontWeight: 600, letterSpacing: "1px", opacity: 0.5 }}>
                WATCHLIST ({waitSignals.length})
              </div>
              <span style={{ fontSize: 12, color: TEXT_MUT, transform: watchlistExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                ▼
              </span>
            </div>
            
            {watchlistExpanded && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, position: "relative" }}>
                {waitSignals.length > 0 ? waitSignals
                  .sort((a, b) => a.symbol.localeCompare(b.symbol))
                  .map(s => (
                    <div 
                      key={s.symbol} 
                      onMouseEnter={() => setHoveredTicker(s)}
                      onMouseLeave={() => setHoveredTicker(null)}
                      style={{
                        background: SURFACE,
                        border: `0.5px solid ${BORDER}`,
                        borderRadius: 8,
                        padding: "8px",
                        fontSize: 11,
                        color: TEXT_PRI,
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 600,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                        position: "relative"
                      }}
                    >
                      {s.symbol}
                      
                      {/* Hover 시 상세 카드 */}
                      {hoveredTicker?.symbol === s.symbol && (
                        <div style={{
                          position: "fixed",
                          zIndex: 9999,
                          background: SURFACE,
                          border: `1px solid ${BLUE}`,
                          borderRadius: 12,
                          padding: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
                          width: 160,
                          marginTop: -80,
                          marginLeft: -80
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRI }}>{s.symbol}</div>
                          <div style={{ fontSize: 9, color: TEXT_MUT }}>{s.name}</div>
                          <div style={{ fontSize: 15, color: s.score > 0 ? GREEN : RED, marginTop: 2 }}>{s.score > 0 ? '+' : ''}{s.score}</div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ 
                      gridColumn: "1 / -1",
                      textAlign: "center", 
                      padding: "40px 20px",
                      color: TEXT_HINT,
                      fontSize: 12
                    }}>
                      대기 중인 시그널이 없습니다
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {activeTab === "positions" && isPremium && (
          <div>
            {/* 시간대 표시 */}
            <div style={{ fontSize: 11, color: TEXT_PRI, marginBottom: 8, fontWeight: 600 }}>
              📊 {timeframe === "5m" ? "5분" : timeframe === "30m" ? "30분" : timeframe === "1h" ? "1시간" : "일"}봉 포지션
            </div>
            {/* 진입 중인 포지션 */}
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px" }}>
              진입 중인 포지션
            </div>
            {signals.filter(s => s.position).length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
                {signals.filter(s => s.position).map((s, idx) => (
                  <PositionCard key={`${s.symbol}-${idx}`} signal={s} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 20px", color: TEXT_HINT, marginBottom: 20 }}>
                진입 중인 포지션이 없습니다
              </div>
            )}
            
            {/* 완료된 거래 (거래 내역에서 EXIT만) */}
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px" }}>
              익절/손절 완료 ({timeframe === "5m" ? "5분" : timeframe === "30m" ? "30분" : timeframe === "1h" ? "1시간" : "일"}봉)
            </div>
            {trades.filter(t => t.Status === "EXIT").length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trades.filter(t => t.Status === "EXIT").map((trade, i) => (
                  <div key={i} style={{
                    background: SURFACE,
                    border: `0.5px solid ${trade.Profit?.startsWith("+") ? GREEN : RED}`,
                    borderRadius: 10,
                    padding: "12px 14px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ 
                          fontFamily: "'Orbitron', sans-serif", 
                          fontSize: 13, 
                          fontWeight: 700,
                          color: TEXT_PRI 
                        }}>
                          {trade.Ticker}
                        </span>
                        <span style={{ 
                          fontSize: 9,
                          marginLeft: 8,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: trade.Side === "LONG" ? `${GREEN}22` : `${RED}22`,
                          color: trade.Side === "LONG" ? GREEN : RED
                        }}>
                          {trade.Side}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: trade.Profit?.startsWith("+") ? GREEN : RED
                      }}>
                        {trade.Profit}
                      </span>
                    </div>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: TEXT_MUT,
                      marginTop: 8
                    }}>
                      <span>진입: {trade.Entry}</span>
                      <span>청산: {trade.Exit}</span>
                      <span>{trade.Timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 20px", color: TEXT_HINT }}>
                완료된 거래가 없습니다
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && isPremium && (
          <div>
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px" }}>
              거래 내역
            </div>
            {trades.length > 0 ? (
              <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                {/* 헤더 */}
                <div style={{ 
                  display: "grid",
                  gridTemplateColumns: "65px 55px 45px 1fr 60px 55px",
                  padding: "10px 12px",
                  background: BG,
                  fontSize: 9,
                  color: TEXT_MUT,
                  fontWeight: 600,
                  letterSpacing: "0.5px"
                }}>
                  <span>시간</span>
                  <span>티커</span>
                  <span>방향</span>
                  <span style={{ textAlign: "center" }}>진입가 → 청산가</span>
                  <span style={{ textAlign: "right" }}>수익</span>
                  <span style={{ textAlign: "center" }}>상태</span>
                </div>
                {trades.slice(0, 20).map((trade, i) => (
                  <div key={i} style={{ 
                    display: "grid",
                    gridTemplateColumns: "65px 55px 45px 1fr 60px 55px",
                    padding: "10px 12px",
                    fontSize: 10,
                    borderTop: `0.5px solid ${BORDER}`,
                    alignItems: "center"
                  }}>
                    <span style={{ color: TEXT_MUT, fontSize: 9 }}>{trade.Timestamp?.split(' ')[1]?.substring(0, 5) || trade.Timestamp}</span>
                    <span style={{ color: trade.Side === "LONG" ? GREEN : RED, fontWeight: 600, fontSize: 11 }}>{trade.Ticker?.replace('-USD', '')}</span>
                    <span style={{ color: trade.Side === "LONG" ? GREEN : RED, fontSize: 9 }}>{trade.Side}</span>
                    <span style={{ textAlign: "center", fontSize: 9, color: TEXT_MUT }}>
                      ${parseFloat(trade.Entry).toFixed(2)} 
                      <span style={{ color: TEXT_HINT }}>→</span> 
                      {trade.Exit ? `$${parseFloat(trade.Exit).toFixed(2)}` : "-"}
                    </span>
                    <span style={{ 
                      color: trade.Profit?.startsWith("+") ? GREEN : trade.Profit?.startsWith("-") ? RED : TEXT_MUT,
                      fontWeight: 600,
                      textAlign: "right",
                      fontSize: 10
                    }}>{trade.Profit}</span>
                    <span style={{ 
                      color: trade.Status === "ENTRY" ? SILVER : trade.Side === "LONG" ? GREEN : RED,
                      textAlign: "center",
                      fontSize: 9,
                      fontWeight: 600
                    }}>{trade.Status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: TEXT_HINT }}>
                거래 내역이 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 네비 */}
      <StockNavBar active="scanner" />
    </div>
  )
}
