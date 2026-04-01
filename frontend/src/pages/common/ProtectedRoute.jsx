import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../../supabase"
import { useGlobalLoading } from "../../App"

const BG = "#080c10"
const BLUE = "#3B5BDB"

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed,   setAuthed]   = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    showLoading("AUTHENTICATING...")
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecking(false)
      hideLoading()
    })
  }, [])

  if (checking) return null  // GlobalLoader가 처리

  return authed ? children : <Navigate to="/" replace />
}
