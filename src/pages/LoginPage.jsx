import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    // 뼈대 단계 — 실제로는 Supabase Auth(이메일/비밀번호)로 검증합니다.
    login(email)
    const redirectTo = location.state?.from?.pathname ?? '/'
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 px-6">
      <div className="text-xs font-mono tracking-widest text-gray-400">
        광고 없는 찐맛집 · 일본 여행 전용
      </div>
      <div className="text-xl font-bold text-brand-navy">J-Taste Pass</div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-2.5 mt-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-navy"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-navy"
        />
        {error && <div className="text-xs text-status-soldout">{error}</div>}
        <button
          type="submit"
          className="bg-brand-coral text-white font-bold text-sm rounded-lg py-2.5"
        >
          로그인
        </button>
      </form>

      <div className="text-xs text-gray-400 text-center">
        아직 계정이 없으신가요? 회원가입
        <br />
        (뼈대 단계 — Supabase Auth 이메일/비밀번호. 구글 로그인은 추후 도입)
      </div>
    </div>
  )
}
