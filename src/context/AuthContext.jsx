import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// 로그인/회원가입/세션은 Supabase Auth(이메일/비밀번호)로 실제 연동됩니다.
// 스크랩은 아직 localStorage로 흉내만 냅니다(scraps 테이블 연동은 별도 작업).

const DEMO_SCRAP_IDS = ['sushi-masa', 'ichiran-osaka', 'okonomiyaki-mizuno']
const RECENT_SEARCHES_KEY = 'gurume_recent_searches'
const MAX_RECENT_SEARCHES = 15

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [scrapIds, setScrapIds] = useState(() => {
    const saved = localStorage.getItem('gurume_scrap_ids')
    return saved ? JSON.parse(saved) : DEMO_SCRAP_IDS
  })
  // 로그인 상태면 search_history 테이블, 비로그인이면 localStorage — scrapIds와 같은 이원화 패턴.
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setNickname(null)
      setAvatar(null)
      return
    }

    setAvatar(localStorage.getItem(`gurume_avatar_${userId}`))

    supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single()
      .then(({ data }) => setNickname(data?.nickname ?? null))
  }, [session?.user?.id])

  useEffect(() => {
    localStorage.setItem('gurume_scrap_ids', JSON.stringify(scrapIds))
  }, [scrapIds])

  // 로그인 시에만 DB에서 검색 기록을 불러와 로컬 state를 덮어씀. 초기 마운트(세션 로딩 중)나 비로그인
  // 상태에서는 아무것도 하지 않아 localStorage에서 읽어온 초기값이 그대로 유지되도록 함 — 여기서 무조건
  // setRecentSearches([])를 호출하면 페이지 이동마다 AuthProvider가 재마운트되며 비로그인 사용자의
  // 저장된 검색 기록이 매번 사라지는 버그가 생김.
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    supabase
      .from('search_history')
      .select('id, keyword, searched_at')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(MAX_RECENT_SEARCHES)
      .then(({ data }) => setRecentSearches(data ?? []))
  }, [session?.user?.id])

  // 로그아웃 전환(로그인 → 비로그인) 시에만 DB 기록을 지우고 localStorage 값으로 되돌림 — 다른 계정
  // 기록이 남아있는 걸 방지하되, 최초 마운트(세션 아직 undefined)는 로그아웃 전환이 아니므로 건너뜀.
  const [hadSession, setHadSession] = useState(false)
  useEffect(() => {
    if (session?.user) {
      setHadSession(true)
    } else if (hadSession) {
      setHadSession(false)
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      setRecentSearches(saved ? JSON.parse(saved) : [])
    }
  }, [session?.user, hadSession])

  useEffect(() => {
    if (!session?.user) {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches))
    }
  }, [recentSearches, session?.user])

  async function addRecentSearch(keyword) {
    const trimmed = keyword.trim()
    if (!trimmed) return

    if (session?.user) {
      const { data, error } = await supabase
        .from('search_history')
        .insert({ user_id: session.user.id, keyword: trimmed })
        .select('id, keyword, searched_at')
        .single()
      if (error) return
      setRecentSearches((prev) => [data, ...prev.filter((r) => r.keyword !== trimmed)].slice(0, MAX_RECENT_SEARCHES))
    } else {
      setRecentSearches((prev) => {
        const withoutDup = prev.filter((r) => r.keyword !== trimmed)
        const next = { id: crypto.randomUUID(), keyword: trimmed, searched_at: new Date().toISOString() }
        return [next, ...withoutDup].slice(0, MAX_RECENT_SEARCHES)
      })
    }
  }

  async function removeRecentSearch(id) {
    setRecentSearches((prev) => prev.filter((r) => r.id !== id))
    if (session?.user) {
      await supabase.from('search_history').delete().eq('id', id).eq('user_id', session.user.id)
    }
  }

  async function clearRecentSearches() {
    const ids = recentSearches.map((r) => r.id)
    setRecentSearches([])
    if (session?.user && ids.length > 0) {
      await supabase.from('search_history').delete().in('id', ids).eq('user_id', session.user.id)
    }
  }

  const user = session?.user
    ? { id: session.user.id, email: session.user.email, nickname: nickname ?? undefined, avatar: avatar ?? undefined }
    : null

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { needsEmailConfirmation: !data.session }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function changePassword(currentPassword, newPassword) {
    if (!session?.user?.email) throw new Error('로그인이 필요합니다.')
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    })
    if (reauthError) throw new Error('현재 비밀번호가 올바르지 않습니다.')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function updateNickname(nextNickname) {
    if (!session?.user) return
    const { error } = await supabase.from('profiles').update({ nickname: nextNickname }).eq('id', session.user.id)
    if (error) throw error
    setNickname(nextNickname)
  }

  function updateAvatar(avatarDataUrl) {
    if (!session?.user) return
    localStorage.setItem(`gurume_avatar_${session.user.id}`, avatarDataUrl)
    setAvatar(avatarDataUrl)
  }

  function toggleScrap(restaurantId) {
    setScrapIds((prev) =>
      prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    changePassword,
    updateNickname,
    updateAvatar,
    scrapIds,
    toggleScrap,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
