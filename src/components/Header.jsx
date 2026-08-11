import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { IconClose, IconLogout, IconMenu, IconSearch, IconUser } from './icons'
import SearchAutocompleteInput from './SearchAutocompleteInput'

const navLinkClass = (isActive) =>
  `text-lg font-semibold ${isActive ? 'text-brand-navy border-b-2 border-brand-coral pb-0.5' : 'text-gray-500 hover:text-brand-navy'}`

const mobileNavLinkClass = (isActive) =>
  `px-4 py-3 text-lg font-semibold border-b border-gray-100 ${isActive ? 'text-brand-navy' : 'text-gray-600'}`

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
    <nav className="relative flex items-center gap-6 px-4 sm:px-6 py-6 bg-white shadow-[0_4px_16px_-4px_rgba(109,40,217,0.15)] z-10">
      <Link to="/" className="flex-none">
        <img src="/logo.png" alt="Gurume Tabi" className="h-[43.2px] sm:h-12 w-auto" />
      </Link>

      {/* 데스크톱 nav 링크 — 화면 정중앙 고정, 모바일에서는 숨기고 햄버거 메뉴로 이동 */}
      <div className="hidden md:flex items-center gap-[4.5rem] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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
          <IconSearch className="w-3.5 h-3.5 text-gray-400 flex-none" />
          <SearchAutocompleteInput
            value={q}
            onChange={setQ}
            onSubmit={(picked) => navigate(`/search?q=${encodeURIComponent(picked)}`)}
            placeholder="지역·음식 검색"
            inputClassName="bg-transparent outline-none text-xs text-gray-600 w-full"
            wrapperClassName="relative flex-1"
            listClassName="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-30 overflow-hidden"
          />
        </form>
      )}

      {user ? (
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          aria-label="로그아웃"
          title="로그아웃"
          className="text-gray-500 hover:text-brand-navy transition-colors cursor-pointer"
        >
          <IconLogout className="w-7 h-7" />
        </button>
      ) : (
        <Link
          to="/login"
          aria-label="로그인"
          title="로그인"
          className="text-gray-500 hover:text-brand-navy transition-colors cursor-pointer"
        >
          <IconUser className="w-7 h-7" />
        </Link>
      )}

      {/* 햄버거 버튼 — 모바일 전용 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        className="md:hidden text-brand-navy"
      >
        {menuOpen ? <IconClose className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
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
