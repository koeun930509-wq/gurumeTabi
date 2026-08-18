import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconLock, IconMail } from '../components/icons'

function signupErrorMessage(error) {
  if (error.message === 'User already registered') {
    return '이미 가입된 이메일입니다.'
  }
  if (error.message?.includes('Password should be at least')) {
    return '비밀번호는 6자 이상이어야 합니다.'
  }
  return error.message
}

export default function SignUpPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signup(email, password)
      if (needsEmailConfirmation) {
        setNotice('가입 확인 이메일을 보냈어요. 메일함에서 인증 링크를 눌러주세요.')
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(signupErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center gap-4 px-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(/loginBg.png)` }}
      />
      <div className="absolute inset-0 bg-brand-navy-dark/35" aria-hidden="true" />

      {notice ? (
        <div className="relative w-full max-w-xs flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] p-7 text-center">
          <Link to="/" className="mb-1">
            <img src="/logo.png" alt="Gurume Tabi" className="h-12 w-auto" />
          </Link>
          <div className="text-xl font-bold text-gray-900">메일함을 확인해주세요</div>
          <div className="text-sm text-gray-500">{notice}</div>
          <Link
            to="/login"
            className="mt-2 bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg py-2.5 w-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)]"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-xs flex flex-col gap-2.5 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] p-7"
        >
          <Link to="/" className="mb-1">
            <img src="/logo.png" alt="Gurume Tabi" className="h-12 w-auto" />
          </Link>
          <div className="text-xl font-bold text-gray-900">회원가입</div>
          <div className="text-sm text-gray-500 mb-2">Gurume Tabi를 시작해보세요</div>

          <label className="text-[11px] font-bold tracking-wide text-gray-500">이메일</label>
          <div className="relative">
            <IconMail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-white/80 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-base outline-none focus:bg-white focus:border-transparent focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
            />
          </div>

          <label className="text-[11px] font-bold tracking-wide text-gray-500 mt-1">비밀번호</label>
          <div className="relative">
            <IconLock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full bg-white/80 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-base outline-none focus:bg-white focus:border-transparent focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
            />
          </div>

          <label className="text-[11px] font-bold tracking-wide text-gray-500 mt-1">비밀번호 확인</label>
          <div className="relative">
            <IconLock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              className="w-full bg-white/80 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-base outline-none focus:bg-white focus:border-transparent focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
            />
          </div>

          {error && <div className="text-sm text-status-soldout">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg py-2.5 mt-2 shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)] disabled:opacity-60"
          >
            {submitting ? '가입 중...' : '회원가입'}
          </button>

          <div className="text-xs text-gray-500 text-center mt-1">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-semibold text-brand-navy">
              로그인
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
