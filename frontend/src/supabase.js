import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// 기존 API Key 방식과 병행 (마이그레이션 기간)
import { getApiKey, checkAuth, setApiKey } from "./api"

export async function getCurrentUser() {
  // 1. 먼저 Supabase 세션 확인
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    return { 
      user: session.user, 
      isPremium: session.user.user_metadata?.tier === 'premium',
      authType: 'supabase'
    }
  }
  
  // 2. 기존 API Key 방식 폴백
  const apiKey = getApiKey()
  if (apiKey) {
    const auth = await checkAuth()
    return { 
      user: { id: 'api_key_user', email: 'user@example.com' }, 
      isPremium: auth.is_premium,
      authType: 'apikey'
    }
  }
  
  return { user: null, isPremium: false, authType: null }
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('nexus_api_key')
}

export async function fetchUserSubscription() {
  const { user, isPremium } = await getCurrentUser()
  return { tier: isPremium ? 'premium' : 'free', is_premium: isPremium }
}
