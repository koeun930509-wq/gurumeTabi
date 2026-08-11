import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLock, IconMail } from "../components/icons";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    // 뼈대 단계 — 실제로는 Supabase Auth(이메일/비밀번호)로 검증합니다.
    login(email);
    const redirectTo = location.state?.from?.pathname ?? "/";
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center gap-4 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-60 blur-sm scale-105" style={{ backgroundImage: `url(/loginBg.png)` }} />
      <div className="absolute inset-0 bg-brand-navy-dark/35" aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xs flex flex-col gap-2.5 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] p-7"
      >
        <Link to="/" className="mb-1">
          <img src="/logo.png" alt="Gurume Tabi" className="h-12 w-auto" />
        </Link>
        <div className="text-xl font-bold text-gray-900">다시 오셨네요</div>
        <div className="text-sm text-gray-500 mb-2">계속하려면 로그인해주세요</div>

        <label className="text-[11px] font-bold tracking-wide text-gray-500">이메일</label>
        <div className="relative">
          <IconMail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full bg-white/80 rounded-lg pl-10 pr-3 py-2.5 text-base outline-none focus:bg-white focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
          />
        </div>

        <label className="text-[11px] font-bold tracking-wide text-gray-500 mt-1">비밀번호</label>
        <div className="relative">
          <IconLock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full bg-white/80 rounded-lg pl-10 pr-3 py-2.5 text-base outline-none focus:bg-white focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
          />
        </div>

        {error && <div className="text-sm text-status-soldout">{error}</div>}

        <button
          type="submit"
          className="bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg py-2.5 mt-2 shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)]"
        >
          로그인
        </button>

        <div className="text-xs text-gray-500 text-center mt-1">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup" className="font-semibold text-brand-navy">
            회원가입
          </Link>
        </div>
      </form>

      <div className="relative text-xs text-white/80 text-center drop-shadow">
        광고 없는 찐맛집 · 일본 여행 전용
        <br />
        (뼈대 단계 — Supabase Auth 이메일/비밀번호. 구글 로그인은 추후 도입)
      </div>
    </div>
  );
}
