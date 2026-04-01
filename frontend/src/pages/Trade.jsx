import { useState, useCallback, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import useBotStatus from "../hooks/useBotStatus"
import { CryptoNavBar } from "../components/NavBar"

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
const AMBER    = "#f59e0b"

const TRADING_API_URL = import.meta.env.VITE_TRADING_API_URL || "http://localhost:8001"

async function getTradingHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token || ""}`
  }
}

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

function Toggle({ on, onChange, loading, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 9, color: TEXT_MUT, letterSpacing: "1px" }}>AUTO</span>
      <div
        onClick={loading || disabled ? null : onChange}
        style={{
          width: 40, height: 22,
          background: on ? BLUE : disabled ? TEXT_HINT : BORDER,
          borderRadius: 11, position: "relative",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "background .2s"
        }}
      >
        <div style={{
          width: 16, height: 16, background: "#fff",
          borderRadius: "50%", position: "absolute",
          top: 3, left: on ? 21 : 3,
          transition: "left .2s"
        }}/>
        {on && (
          <div style={{
            position: "absolute", top: 7, left: 7,
            width: 8, height: 8, borderRadius: "50%",
            background: "rgba(255,255,255,0.8)",
            animation: "pulse 2s infinite"
          }}/>
        )}
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step = 1, color, unit, onChange, desc }) {
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
          type="range" min={min} max={max} step={step} value={value}
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

export default function Trade() {
  const navigate   = useNavigate()
  const debounce   = useRef(null)

  // 봇 설정 (자체 상태)
  const [leverage,  setLeverage]  = useState(50)
  const [tradePct,  setTradePct]  = useState(5)
  const [slMult,    setSlMult]    = useState(1.5)
  const [tpMult,    setTpMult]    = useState(3.5)

  const [togLoading,  setTogLoading]  = useState(false)
  const [saveMsg,     setSaveMsg]     = useState("")
  const [errorMsg,    setErrorMsg]    = useState("")
  const [showApiForm, setShowApiForm] = useState(false)
  const [apiKey,      setApiKey]      = useState("")
  const [secretKey,   setSecretKey]   = useState("")
  const [apiSaving,   setApiSaving]   = useState(false)

  const {
    botRunning, setBotRunning,
    connected,
    serverMsg, setServerMsg,
    balance, unrealized, positions,
    selectedSymbols, setSelectedSymbols,
    hasApiKey,
    poll,
  } = useBotStatus()

  const balNum = parseFloat(String(balance).replace(/[$,]/g, "")) || 0

  // 서버에서 현재 설정 로드
  useEffect(() => {
    const load = async () => {
      try {
        const headers = await getTradingHeaders()
        const res = await fetch(`${TRADING_API_URL}/user/settings`, { headers })
        if (res.ok) {
          const s = await res.json()
          if (s.leverage)    setLeverage(s.leverage)
          if (s.trade_pct)   setTradePct(Math.round(s.trade_pct * 100))
          if (s.sl_atr_mult) setSlMult(s.sl_atr_mult)
          if (s.tp_atr_mult) setTpMult(s.tp_atr_mult)
        }
      } catch {}
    }
    load()
  }, [])

  const syncSettings = useCallback(async (overrides = {}) => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        const headers = await getTradingHeaders()
        await fetch(`${TRADING_API_URL}/user/settings`, {
          method: "POST", headers,
          body: JSON.stringify({
            leverage,
            trade_pct:   tradePct / 100,
            sl_atr_mult: slMult,
            tp_atr_mult: tpMult,
            sl_mode: "atr",
            selected_symbols: selectedSymbols,
            ...overrides
          })
        })
        setSaveMsg("✓ 저장됨")
        setTimeout(() => setSaveMsg(""), 2000)
      } catch {
        setSaveMsg("저장 실패")
        setTimeout(() => setSaveMsg(""), 2000)
      }
    }, 800)
  }, [leverage, tradePct, slMult, tpMult, selectedSymbols])

  const handleToggle = async () => {
    if (!connected || togLoading) return
    if (!hasApiKey) {
      setShowApiForm(true)
      return
    }
    setTogLoading(true)
    try {
      const headers = await getTradingHeaders()
      if (botRunning) {
        await fetch(`${TRADING_API_URL}/bot/stop`, { method: "POST", headers })
        setBotRunning(false)
        setServerMsg("자동매매 정지")
      } else {
        const res = await fetch(`${TRADING_API_URL}/bot/start`, {
          method: "POST", headers,
          body: JSON.stringify({
            leverage, trade_pct: tradePct / 100,
            sl_atr_mult: slMult, tp_atr_mult: tpMult,
            sl_mode: "atr", selected_symbols: selectedSymbols,
          })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || "시작 실패")
        }
        setBotRunning(true)
        setServerMsg("자동매매 실행 중")
      }
    } catch (e) {
      setErrorMsg(e.message || "오류가 발생했습니다")
      setTimeout(() => setErrorMsg(""), 4000)
    } finally {
      setTogLoading(false)
      await poll()
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey || !secretKey) { setErrorMsg("API 키와 Secret 키를 모두 입력하세요"); return }
    setApiSaving(true)
    try {
      const headers = await getTradingHeaders()
      const res = await fetch(`${TRADING_API_URL}/api-key/save`, {
        method: "POST", headers,
        body: JSON.stringify({ api_key: apiKey, secret_key: secretKey })
      })
      if (!res.ok) throw new Error("저장 실패")
      setShowApiForm(false)
      setApiKey(""); setSecretKey("")
      setSaveMsg("✓ Binance API 키 저장 완료")
      setTimeout(() => setSaveMsg(""), 3000)
      await poll()
    } catch (e) {
      setErrorMsg(e.message)
      setTimeout(() => setErrorMsg(""), 4000)
    } finally {
      setApiSaving(false)
    }
  }

  const toggleSymbol = (sym) => {
    const next = selectedSymbols.includes(sym)
      ? selectedSymbols.filter(s => s !== sym)
      : [...selectedSymbols, sym]
    if (next.length === 0) return
    setSelectedSymbols(next)
    syncSettings({ selected_symbols: next })
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT_PRI, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", paddingBottom: 80 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={26}/>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>
            <span style={{ color: BLUE_LT }}>QUANTER</span>
            <span style={{ color: TEXT_MUT }}>.TRADING</span>
          </span>
        </div>
        <Toggle on={botRunning} onChange={handleToggle} loading={togLoading} disabled={!connected}/>
      </div>

      {/* 알림 메시지 */}
      {errorMsg && (
        <div style={{ margin: "8px 18px 0", padding: "10px 14px", background: "#2a1010", border: `0.5px solid ${RED}40`, borderRadius: 10, fontSize: 11, color: RED }}>
          ⚠️ {errorMsg}
        </div>
      )}
      {saveMsg && (
        <div style={{ margin: "8px 18px 0", padding: "10px 14px", background: "#0a2a10", border: `0.5px solid ${GREEN}40`, borderRadius: 10, fontSize: 11, color: GREEN }}>
          {saveMsg}
        </div>
      )}

      {/* 서버 상태 */}
      <div style={{ margin: "8px 18px 0", padding: "8px 14px", background: SURFACE, border: `0.5px solid ${!connected ? RED+"40" : botRunning ? GREEN+"40" : BORDER}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: !connected ? RED : botRunning ? GREEN : TEXT_HINT, boxShadow: botRunning ? `0 0 8px ${GREEN}` : "none" }}/>
        <span style={{ color: !connected ? RED : botRunning ? GREEN : TEXT_MUT }}>
          {!connected ? "서버 연결 안됨 — Render에 Trading API 배포 필요" : serverMsg || "대기 중"}
        </span>
      </div>

      {/* Binance API 키 미등록 안내 */}
      {connected && !hasApiKey && (
        <div style={{ margin: "8px 18px 0", padding: "14px", background: `${AMBER}10`, border: `0.5px solid ${AMBER}40`, borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: AMBER, marginBottom: 6 }}>⚡ Binance API 키 등록 필요</div>
          <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 10, lineHeight: 1.6 }}>
            자동매매를 시작하려면 Binance API 키를 먼저 등록해야 합니다.
          </div>
          <button
            onClick={() => setShowApiForm(true)}
            style={{ background: AMBER, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#000", cursor: "pointer" }}
          >
            API 키 등록하기
          </button>
        </div>
      )}

      {/* Binance API 키 입력 폼 */}
      {showApiForm && (
        <div style={{ margin: "8px 18px 0", padding: "16px", background: SURFACE, border: `0.5px solid ${BLUE}40`, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: BLUE_LT }}>Binance API 키 등록</div>
          <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 14, lineHeight: 1.6 }}>
            Binance → API Management에서 발급받은 키를 입력하세요.<br/>
            <span style={{ color: AMBER }}>선물 거래 권한</span>이 활성화되어 있어야 합니다.
          </div>
          {[
            { label: "API Key", val: apiKey, set: setApiKey, placeholder: "Binance API Key" },
            { label: "Secret Key", val: secretKey, set: setSecretKey, placeholder: "Binance Secret Key" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: TEXT_MUT, marginBottom: 5 }}>{label}</div>
              <input
                type="password" value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT_PRI, fontSize: 12, boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleSaveApiKey}
              disabled={apiSaving}
              style={{ flex: 1, background: BLUE, border: "none", borderRadius: 8, padding: "10px", fontSize: 11, fontWeight: 700, color: "#fff", cursor: apiSaving ? "not-allowed" : "pointer", opacity: apiSaving ? 0.7 : 1 }}
            >
              {apiSaving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => setShowApiForm(false)}
              style={{ flex: 1, background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "10px", fontSize: 11, color: TEXT_MUT, cursor: "pointer" }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* 잔고 / PNL */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Balance", value: balance, color: TEXT_PRI },
            { label: "미실현 PNL", value: unrealized, color: unrealized.startsWith("+") ? GREEN : unrealized === "--" ? TEXT_MUT : RED },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "14px 12px" }}>
              <div style={{ fontSize: 9, color: TEXT_MUT, marginBottom: 4, letterSpacing: "0.5px" }}>{label}</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 심볼 선택 */}
        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>ASSETS</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["BTCUSDT", "ETHUSDT", "SOLUSDT"].map(sym => {
              const on = selectedSymbols.includes(sym)
              return (
                <div
                  key={sym}
                  onClick={() => toggleSymbol(sym)}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 12, textAlign: "center",
                    fontSize: 12, fontWeight: 700,
                    background: on ? BLUE : SURFACE,
                    border: `1.5px solid ${on ? BLUE_LT : BORDER}`,
                    color: on ? "#fff" : TEXT_MUT,
                    cursor: "pointer", transition: "all 0.2s",
                    userSelect: "none"
                  }}
                >
                  {sym.replace("USDT", "")}
                </div>
              )
            })}
          </div>
        </div>

        {/* 포지션 */}
        <div>
          <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px", marginBottom: 10 }}>
            POSITIONS {positions.length > 0 && `(${positions.length})`}
          </div>
          
          {/* 포지션 리스트 - 표 형식 (Table-like List) */}
          <div style={{ marginTop: 20 }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              padding: "0 12px 8px", 
              fontSize: 11, 
              color: TEXT_MUT,
              borderBottom: `1px solid ${BORDER}` 
            }}>
              <span style={{ flex: 2 }}>심볼 / 상태</span>
              <span style={{ flex: 1.5, textAlign: "right" }}>진입/현재가</span>
              <span style={{ flex: 1, textAlign: "right" }}>수익률</span>
            </div>

            {positions.length > 0 ? (
              positions.map((pos) => {
                const pnl = pos.mark 
                  ? ((pos.mark - pos.entry) / pos.entry * 100 * (pos.side === 'LONG' ? 1 : -1)).toFixed(2)
                  : "0.00";
                const isPlus = parseFloat(pnl) >= 0;

                return (
                  <div key={pos.id || pos.symbol} style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 12px",
                    background: SURFACE,
                    borderBottom: `0.5px solid ${BORDER}`,
                    transition: "background 0.2s"
                  }}>
                    {/* 1. 심볼 및 방향 */}
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: 700, color: TEXT_PRI, fontSize: 14 }}>{pos.symbol}</div>
                      <div style={{ 
                        fontSize: 10, 
                        color: pos.side === 'LONG' ? GREEN : RED, 
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <span style={{ fontSize: 8 }}>●</span> {pos.side}
                      </div>
                    </div>

                    {/* 2. 가격 정보 (진입가/현재가) */}
                    <div style={{ flex: 1.5, textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: TEXT_PRI, fontWeight: 500 }}>
                        ${pos.mark?.toLocaleString() || "---"}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MUT }}>
                        ${pos.entry?.toLocaleString()}
                      </div>
                    </div>

                    {/* 3. 수익률 (PnL) */}
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 800, 
                        color: isPlus ? GREEN : RED,
                        textShadow: isPlus ? `0 0 8px ${GREEN}44` : `0 0 8px ${RED}44` 
                      }}>
                        {isPlus ? "+" : ""}{pnl}%
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: TEXT_HINT, fontSize: 13 }}>
                활성 포지션이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 설정 슬라이더 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: TEXT_HINT, letterSpacing: "2px" }}>CONTROLS</div>
            {saveMsg && <div style={{ fontSize: 10, color: GREEN }}>{saveMsg}</div>}
          </div>
          <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
            <SliderRow label="레버리지"     desc="수익/손실 증폭"                              value={leverage} min={1}   max={125} step={1}   color={BLUE_LT} unit="x" onChange={v => { setLeverage(v);  syncSettings({ leverage: v }) }}/>
            <SliderRow label="진입 사이즈"  desc={balNum > 0 ? `약 $${(balNum * tradePct / 100).toFixed(2)} 투입` : "잔고의 비율"} value={tradePct} min={1} max={100} step={1} color={BLUE_LT} unit="%" onChange={v => { setTradePct(v);  syncSettings({ trade_pct: v / 100 }) }}/>
            <SliderRow label="손절 ATR 배수" desc="entry ± ATR×N 에서 손절"                    value={slMult}   min={0.5} max={5}   step={0.1} color={RED}     unit="x" onChange={v => { setSlMult(v);    syncSettings({ sl_atr_mult: v }) }}/>
            <SliderRow label="익절 ATR 배수" desc="entry ± ATR×N 에서 익절"                    value={tpMult}   min={0.5} max={10}  step={0.1} color={GREEN}   unit="x" onChange={v => { setTpMult(v);    syncSettings({ tp_atr_mult: v }) }}/>
          </div>
        </div>

        {/* 패닉 버튼 */}
        {botRunning && (
          <div
            onClick={async () => {
              if (!window.confirm("봇을 정지할까요? (포지션은 유지됩니다)")) return
              try {
                const headers = await getTradingHeaders()
                await fetch(`${TRADING_API_URL}/bot/stop`, { method: "POST", headers })
                setBotRunning(false)
                setServerMsg("봇 정지 완료")
                await poll()
              } catch {}
            }}
            style={{
              background: "#0d0606", border: "0.5px solid #2a1010", borderRadius: 12,
              padding: "18px", fontFamily: "'Orbitron', sans-serif",
              fontSize: 11, fontWeight: 700, color: RED,
              letterSpacing: "2px", textAlign: "center",
              cursor: "pointer", userSelect: "none"
            }}
          >
            PANIC STOP — 봇 정지
          </div>
        )}
      </div>

      {/* 하단 네비 */}
      <CryptoNavBar active="bot" />
    </div>
  )
}
