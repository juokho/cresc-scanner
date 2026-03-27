// ============================================================
// Supabase 호환성 레이어 (현재 API Key 인증용)
// 원본 Supabase 대체
// ============================================================

import { getApiKey, checkAuth } from "./api"

// 호환성을 위한 더미 클라이언트
export const supabase = {
  auth: {
    async getSession() {
      const apiKey = getApiKey()
      if (!apiKey) {
        return { data: { session: null }, error: null }
      }
      // API Key가 있으면 유효성 확인
      const auth = await checkAuth()
      if (auth.is_premium || apiKey) {
        return {
          data: {
            session: {
              access_token: apiKey,
              user: { id: "api_key_user", email: "user@example.com" }
            }
          },
          error: null
        }
      }
      return { data: { session: null }, error: null }
    },
    
    async getUser() {
      const session = await this.getSession()
      return { data: { user: session.data.session?.user || null }, error: null }
    },
    
    async signInWithPassword({ email, password }) {
      // 현재 백엔드는 email/password 미지원 - API Key 직접 입력 방식
      console.log("Email/password login not supported. Please use API Key.")
      return { data: { user: null, session: null }, error: { message: "Use API Key instead" } }
    },
    
    async signOut() {
      localStorage.removeItem('nexus_api_key')
      return { error: null }
    },
    
    onAuthStateChange(callback) {
      // 실시간 상태 변경 미지원
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  
  from(table) {
    return {
      async select(columns) {
        return { data: [], error: null }
      },
      async insert(data) {
        return { data: null, error: null }
      },
      async update(data) {
        return { data: null, error: null }
      },
      eq(column, value) {
        return this
      },
      single() {
        return { data: null, error: null }
      }
    }
  }
}

// 원본과 호환되는 구독 조회 함수
export async function fetchUserSubscription() {
  return await checkAuth()
}
