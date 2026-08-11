import { createContext, useContext, useEffect, useState } from 'react'

// 뼈대 단계 — 실제로는 Supabase Auth(이메일/비밀번호)를 사용합니다.
// 지금은 로그인 상태와 저장한 맛집(saved_places 대응)을 localStorage로 흉내만 냅니다.

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gurume_user')
    return saved ? JSON.parse(saved) : null
  })
  const [savedIds, setSavedIds] = useState(() => {
    const saved = localStorage.getItem('gurume_saved_ids')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    if (user) localStorage.setItem('gurume_user', JSON.stringify(user))
    else localStorage.removeItem('gurume_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('gurume_saved_ids', JSON.stringify(savedIds))
  }, [savedIds])

  function login(email) {
    // 가짜 로그인 — 비밀번호 검증 없이 이메일만으로 로그인 처리
    setUser({ email })
  }

  function logout() {
    setUser(null)
  }

  function toggleSave(restaurantId) {
    setSavedIds((prev) =>
      prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const value = { user, login, logout, savedIds, toggleSave }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
