import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navLinkClass = (isActive) =>
  `text-sm font-semibold ${isActive ? 'text-brand-navy border-b-2 border-brand-coral pb-0.5' : 'text-gray-500 hover:text-brand-navy'}`

const mobileNavLinkClass = (isActive) =>
  `px-4 py-3 text-sm font-semibold border-b border-gray-100 ${isActive ? 'text-brand-navy' : 'text-gray-600'}`

export default function Header({ active, showSearch = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e) {
    e.preventDefault()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <nav className="relative flex items-center gap-6 px-4 sm:px-6 py-3.5 border-b-2 border-brand-coral bg-white">
      <Link to="/" className="font-extrabold text-brand-navy text-base">
        J-Taste Pass
      </Link>

      {/* 데스크톱 nav 링크 — 모바일에서는 숨기고 햄버거 메뉴로 이동 */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/search" className={navLinkClass(active === 'search')}>
          검색
        </Link>
        <Link to="/saved" className={navLinkClass(active === 'saved')}>
          저장한 맛집
        </Link>
        <Link to="/mypage" className={navLinkClass(active === 'mypage')}>
          마이페이지
        </Link>
      </div>

      <div className="flex-1" />

      {showSearch && (
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 min-w-[170px]"
        >
          <span className="text-xs">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="지역·음식 검색"
            className="bg-transparent outline-none text-xs text-gray-600 w-full"
          />
        </form>
      )}

      {user ? (
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="bg-brand-coral text-white text-sm font-bold px-3.5 py-1.5 rounded-md"
        >
          로그아웃
        </button>
      ) : (
        <Link
          to="/login"
          className="bg-brand-coral text-white text-sm font-bold px-3.5 py-1.5 rounded-md"
        >
          로그인
        </Link>
      )}

      {/* 햄버거 버튼 — 모바일 전용 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        className="md:hidden text-xl leading-none text-brand-navy"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-white border-b border-gray-200 shadow-md z-20 flex flex-col">
          <Link
            to="/search"
            onClick={() => setMenuOpen(false)}
            className={mobileNavLinkClass(active === 'search')}
          >
            검색
          </Link>
          <Link
            to="/saved"
            onClick={() => setMenuOpen(false)}
            className={mobileNavLinkClass(active === 'saved')}
          >
            저장한 맛집
          </Link>
          <Link
            to="/mypage"
            onClick={() => setMenuOpen(false)}
            className={mobileNavLinkClass(active === 'mypage')}
          >
            마이페이지
          </Link>
        </div>
      )}
    </nav>
  )
}
