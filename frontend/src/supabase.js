import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseKey)

// API 함수들도 여기에 추가 가능
export async function fetchUserSubscription() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return data
  } catch (error) {
    console.error('구독 정보 조회 오류:', error)
    return null
  }
}