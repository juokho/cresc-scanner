import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../supabase"

const BG = "#080c10"
const BLUE = "#3B5BDB"

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed,   setAuthed]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecking(false)
    })
  }, [])

  if (checking) return (
    <div style={{
      background: BG, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `3px solid ${BLUE}30`,
        borderTop: `3px solid ${BLUE}`,
        animation: "spin 0.8s linear infinite"
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return authed ? children : <Navigate to="/" replace />
}
