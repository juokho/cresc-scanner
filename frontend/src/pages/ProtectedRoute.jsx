import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../supabase"

/**
 * ProtectedRoute
 * Supabase 세션이 없으면 /로 리다이렉트합니다.
 * 세션 확인 중에는 빈 화면을 보여줘 깜박임을 방지합니다.
 */
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed,   setAuthed]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecking(false)
    })
  }, [])

  if (checking) return null
  return authed ? children : <Navigate to="/" replace />
}
