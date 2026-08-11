import { Link } from 'react-router-dom'
import loginBg from '../assets/login-bg.png'

export default function SignUpPage() {
  return (
    <div className="relative min-h-full flex flex-col items-center justify-center gap-4 px-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60 blur-sm scale-105 grayscale"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 bg-brand-coral/30" />

      <div className="relative w-full max-w-xs flex flex-col items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] p-7 text-center">
        <Link
          to="/"
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-coral to-brand-navy flex items-center justify-center text-white font-extrabold text-lg mb-1"
        >
          G
        </Link>
        <div className="text-xl font-bold text-gray-900">회원가입</div>
        <div className="text-sm text-gray-500">
          회원가입 기능은 준비 중이에요. 조금만 기다려주세요!
        </div>

        <Link
          to="/login"
          className="mt-2 bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg py-2.5 w-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)]"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
