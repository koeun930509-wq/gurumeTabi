import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLock, IconMail, IconEye, IconEyeOff } from "../components/icons";

function loginErrorMessage(error) {
  if (error.message === "Invalid login credentials") {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (error.message === "Email not confirmed") {
    return "이메일 인증이 필요합니다. 가입하신 이메일의 확인 링크를 눌러주세요.";
  }
  return error.message;
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center gap-4 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(/loginBg.png)` }} />
      <div className="absolute inset-0 bg-brand-navy-dark/35" aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xs flex flex-col gap-2.5 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] p-7"
      >
        <Link to="/" className="mb-1">
          <img src="/logo.png" alt="Gurume Tabi" className="h-12 w-auto" />
        </Link>
        <div className="text-xl font-bold text-gray-900 mb-2">Welcome!</div>

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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full bg-white/80 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-base outline-none focus:bg-white focus:border-transparent focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
          </button>
        </div>

        {error && <div className="text-sm text-status-soldout">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg py-2.5 mt-2 shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)] disabled:opacity-60"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>

        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting}
          className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54V6.62H1.26a12 12 0 000 10.76l4.01-3.11z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.62l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
          </svg>
          {googleSubmitting ? "이동 중..." : "Google로 로그인"}
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
      </div>
    </div>
  );
}
