import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { fetchSignals, fetchTrades, fetchUserSubscription, checkAuth, getApiKey, setApiKey } from "../api"

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
const AMBER    = "#d29922"

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
  const { symbol, name, price, signal: sig, score, ci, z, regime, position } = signal
  const isLong = sig === "LONG"
  const isShort = sig === "SHORT"
  const isWait = sig === "WAIT"
  
  const scoreColor = isLong ? GREEN : isShort ? RED : TEXT_MUT
  const scoreFmt = score > 0 ? `+${score}` : score
  
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
            {symbol}
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
      
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT_MUT }}>
        <span>CI: {ci}</span>
        <span>Z: {z}</span>
        <span>{regime}</span>
      </div>
      
      {isPremium && position && (
        <div style={{ 
          marginTop: 10, 
          paddingTop: 10, 
          borderTop: `0.5px solid ${BORDER}`,
          fontSize: 10
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: TEXT_MUT }}>진입가</span>
            <span style={{ color: TEXT_PRI }}>${position.entry.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: TEXT_MUT }}>손절가</span>
            <span style={{ color: RED }}>${position.sl.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: TEXT_MUT }}>익절가</span>
            <span style={{ color: GREEN }}>${position.tp.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [tier, setTier] = useState("free")
  const [scanState, setScanState] = useState({})
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const [activeTab, setActiveTab] = useState("signals")
  const [filter, setFilter] = useState("all")
  const pollRef = useRef(null)

  // 데이터 폴링
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchSignals()
      setSignals(data.signals || [])
      setScanState(data.scan || {})
      setTier(data.tier || "free")
      setIsPremium(data.tier === "premium")
      
      if (data.tier === "premium") {
        const tradesData = await fetchTrades()
        if (!tradesData.error) {
          setTrades(tradesData || [])
        }
      }
    } catch (e) {
      console.error("Fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    pollRef.current = setInterval(fetchData, 10000) // 10초마다 갱신
    return () => clearInterval(pollRef.current)
  }, [fetchData])

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim())
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
      paddingBottom: 100
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
            <span style={{ color: BLUE_LT }}>CRESC</span>.SCANNER
          </span>
          <span style={{
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            background: isPremium ? `${GREEN}22` : `${TEXT_MUT}22`,
            color: isPremium ? GREEN : TEXT_MUT,
            fontWeight: 700,
            letterSpacing: "0.5px"
          }}>
            {tier.toUpperCase()}
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="password"
            placeholder="API Key"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onBlur={handleApiKeySave}
            style={{
              background: SURFACE,
              border: `0.5px solid ${isPremium ? GREEN : BORDER}`,
              borderRadius: 6,
              padding: "6px 10px",
              color: TEXT_PRI,
              fontSize: 10,
              width: 100,
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* 스캔 상태 */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        padding: "12px 18px",
        borderBottom: `0.5px solid ${BORDER}`
      }}>
        {[
          { label: "TOTAL", value: signals.length, color: TEXT_PRI },
          { label: "ACTIVE", value: activeSignals.length, color: GREEN },
          { label: "LONG", value: signals.filter(s => s.signal === "LONG").length, color: GREEN },
          { label: "SHORT", value: signals.filter(s => s.signal === "SHORT").length, color: RED },
        ].map(stat => (
          <div key={stat.label} style={{ 
            flex: 1, 
            background: SURFACE,
            border: `0.5px solid ${BORDER}`,
            borderRadius: 8,
            padding: "8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 8, color: TEXT_MUT, marginBottom: 2, letterSpacing: "0.5px" }}>{stat.label}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: stat.color }}>
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
        {[
          { id: "signals", label: "시그널" },
          { id: "positions", label: "포지션", disabled: !isPremium },
          { id: "history", label: "내역", disabled: !isPremium },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: activeTab === tab.id ? SURFACE : "transparent",
              border: `0.5px solid ${activeTab === tab.id ? BORDER : "transparent"}`,
              borderRadius: 6,
              color: tab.disabled ? TEXT_HINT : activeTab === tab.id ? TEXT_PRI : TEXT_MUT,
              fontSize: 11,
              fontWeight: 500,
              cursor: tab.disabled ? "not-allowed" : "pointer"
            }}
          >
            {tab.label}
            {tab.disabled && <span style={{ fontSize: 8, marginLeft: 4 }}>🔒</span>}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div style={{ padding: "16px 18px" }}>
        {activeTab === "signals" && (
          <>
            {/* 필터 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "전체" },
                { id: "active", label: "ACTIVE" },
                { id: "long", label: "LONG" },
                { id: "short", label: "SHORT" },
                { id: "trend", label: "TREND" },
                { id: "range", label: "RANGE" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    background: filter === f.id ? BLUE : SURFACE,
                    border: `0.5px solid ${filter === f.id ? BLUE : BORDER}`,
                    borderRadius: 6,
                    color: filter === f.id ? "#fff" : TEXT_MUT,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: "pointer"
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

            {/* Watchlist */}
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px", opacity: 0.5 }}>
              WATCHLIST ({waitSignals.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {waitSignals.length > 0 ? waitSignals.map(s => (
                <SignalCard key={s.symbol} signal={s} isPremium={isPremium} />
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
          </>
        )}

        {activeTab === "positions" && isPremium && (
          <div>
            <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 12, fontWeight: 600, letterSpacing: "1px" }}>
              진입 중인 포지션
            </div>
            {signals.filter(s => s.position).length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {signals.filter(s => s.position).map(s => (
                  <SignalCard key={s.symbol} signal={s} isPremium={isPremium} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: TEXT_HINT }}>
                진입 중인 포지션이 없습니다
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
                {trades.slice(0, 20).map((trade, i) => (
                  <div key={i} style={{ 
                    display: "grid",
                    gridTemplateColumns: "80px 60px 40px 70px 70px 60px 60px",
                    padding: "10px 12px",
                    fontSize: 10,
                    borderBottom: `0.5px solid ${BORDER}`,
                    alignItems: "center"
                  }}>
                    <span style={{ color: TEXT_MUT }}>{trade.Timestamp}</span>
                    <span style={{ color: trade.Side === "LONG" ? GREEN : RED, fontWeight: 600 }}>{trade.Ticker}</span>
                    <span style={{ color: trade.Side === "LONG" ? GREEN : RED }}>{trade.Side}</span>
                    <span>{trade.Entry}</span>
                    <span>{trade.Exit || "-"}</span>
                    <span style={{ 
                      color: trade.Profit?.startsWith("+") ? GREEN : RED,
                      fontWeight: 600 
                    }}>{trade.Profit}</span>
                    <span style={{ 
                      color: trade.Status === "ENTRY" ? BLUE : trade.Status === "EXIT" ? AMBER : TEXT_MUT 
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
      <NavBar navigate={navigate} active="home" />
    </div>
  )
}

function NavBar({ navigate, active }) {
  const items = [
    { id: "home", label: "홈", path: "/dashboard" },
    { id: "pricing", label: "플랜", path: "/pricing" },
    { id: "account", label: "내 계정", path: "/account" },
  ]
  
  return (
    <div style={{ 
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex", 
      justifyContent: "space-around", 
      padding: "12px 20px 24px", 
      borderTop: `0.5px solid ${BORDER}`, 
      background: BG,
      maxWidth: 430,
      margin: "0 auto"
    }}>
      {items.map(item => {
        const isActive = active === item.id
        return (
          <div 
            key={item.id} 
            onClick={() => navigate(item.path)} 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 4,
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: 8,
              background: isActive ? `${BLUE}15` : "transparent",
            }}
          >
            <span style={{ 
              fontSize: 10, 
              color: isActive ? BLUE_LT : TEXT_MUT, 
              fontWeight: isActive ? 600 : 400 
            }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
