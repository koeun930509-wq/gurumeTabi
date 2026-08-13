import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// 로그인/회원가입/세션은 Supabase Auth(이메일/비밀번호)로 실제 연동됩니다.
// 스크랩은 아직 localStorage로 흉내만 냅니다(scraps 테이블 연동은 별도 작업).

const DEMO_SCRAP_IDS = ['sushi-masa', 'ichiran-osaka', 'okonomiyaki-mizuno']

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
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
