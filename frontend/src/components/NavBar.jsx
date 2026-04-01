import { useNavigate } from "react-router-dom"

const BLUE    = "#3B5BDB"
const BLUE_LT = "#4C6EF5"
const BG      = "#080c10"
const BORDER  = "#1c2530"
const TEXT_HINT = "#2a3545"

// 미국주식 NavBar - 스캐너가 모니터링 기능 포함
export function StockNavBar({ active }) {
  const navigate = useNavigate()
  const items = [
    { id: "scanner", label: "스캐너", path: "/stock",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke={c} strokeWidth="1.5"/><path d="M7 18v-7h6v7" stroke={c} strokeWidth="1.5"/></svg> },
    { id: "history", label: "내역", path: "/stock/history",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5"/><path d="M10 7v3l2 2" stroke={c} strokeWidth="1.5"/></svg> },
    { id: "account", label: "계정", path: "/account",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke={c} strokeWidth="1.5"/><path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]
  return <NavBarBase items={items} active={active} navigate={navigate} />
}

// 비트코인 NavBar
export function CryptoNavBar({ active }) {
  const navigate = useNavigate()
  const items = [
    { id: "bot", label: "봇제어", path: "/crypto",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5" y="3" width="10" height="14" rx="2" stroke={c} strokeWidth="1.5"/><path d="M8 7h4M8 10h4M8 13h2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id: "monitor", label: "모니터", path: "/crypto/monitor",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="10" width="4" height="8" rx="1" fill={c}/><rect x="8" y="6" width="4" height="12" rx="1" fill={c}/><rect x="14" y="2" width="4" height="16" rx="1" fill={c}/></svg> },
    { id: "account", label: "계정", path: "/account",
      icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke={c} strokeWidth="1.5"/><path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]
  return <NavBarBase items={items} active={active} navigate={navigate} />
}

function NavBarBase({ items, active, navigate }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around",
      padding: "10px 8px 22px",
      borderTop: `0.5px solid ${BORDER}`,
      background: BG, maxWidth: 430, margin: "0 auto", zIndex: 100
    }}>
      {items.map(item => {
        const isActive = active === item.id
        const color = isActive ? BLUE_LT : TEXT_HINT
        return (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              cursor: "pointer", padding: "6px 16px", borderRadius: 10,
              background: isActive ? `${BLUE}20` : "transparent",
              transition: "all 0.15s", userSelect: "none"
            }}
          >
            {item.icon(color)}
            <span style={{ fontSize: 9, color, fontWeight: isActive ? 700 : 400, letterSpacing: "0.3px" }}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
