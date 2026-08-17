import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { IconClose, IconMenu, IconSearch, IconStar, IconUser, IconLogout, IconLogin } from './icons'
import SearchAutocompleteInput from './SearchAutocompleteInput'
import AccountActions from './AccountActions'
import { useAuth } from '../context/AuthContext'

const navLinkClass = (isActive) =>
  `text-lg font-semibold ${isActive ? 'text-brand-navy border-b-2 border-brand-coral pb-0.5' : 'text-gray-500 hover:text-brand-navy'}`

const MOBILE_MENU = [
  { to: '/search', key: 'search', label: '검색', Icon: IconSearch },
  { to: '/scrap', key: 'scrap', label: '스크랩 맛집', Icon: IconStar },
  { to: '/mypage', key: 'mypage', label: '마이페이지', Icon: IconUser },
]

function mobileNavLinkClass(isActive) {
  return `flex items-center gap-3 px-4 py-2.5 text-base font-semibold border-b border-gray-100 transition-colors ${
    isActive ? 'bg-brand-peach/40 text-brand-navy' : 'text-gray-600'
  }`
}

export default function Header({ active, showSearch = true }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e) {
    e.preventDefault()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="relative flex items-center gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-white shadow-[0_4px_16px_-4px_rgba(109,40,217,0.15)] z-10">
      <Link to="/" className="flex-none">
        <img src="/logo.png" alt="Gurume Tabi" className="h-[43.2px] sm:h-12 w-auto" />
      </Link>

      {/* 데스크톱 nav 링크 — 화면 정중앙 고정, 모바일에서는 숨기고 햄버거 메뉴로 이동 */}
      <div className="hidden md:flex items-center gap-[4.5rem] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link to="/search" className={navLinkClass(active === 'search')}>
          검색
        </Link>
        <Link to="/scrap" className={navLinkClass(active === 'scrap')}>
          스크랩 맛집
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

      {/* 데스크톱 — 아바타 + 로그아웃 아이콘 */}
      <div className="hidden md:flex items-center gap-6">
        <AccountActions />
      </div>

      {/* 모바일 — 메뉴 닫혀 있을 때만 아바타 표시(로그아웃은 드롭다운 안으로 이동) */}
      {!menuOpen && (
        <div className="md:hidden flex items-center">
          <AccountActions showLogout={false} />
        </div>
      )}

      {/* 햄버거 버튼 — 모바일 전용 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        className="md:hidden text-brand-navy"
      >
        {menuOpen ? <IconClose className="w-7 h-7" /> : <IconMenu className="w-7 h-7" />}
      </button>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-white border-b border-gray-200 shadow-md z-20 flex flex-col min-h-[calc(100vh-92px)]">
          {MOBILE_MENU.map(({ to, key, label, Icon }) => (
            <Link key={key} to={to} onClick={closeMenu} className={mobileNavLinkClass(active === key)}>
              <Icon className="w-[18px] h-[18px] flex-none" />
              {label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={() => {
                logout()
                navigate('/')
                closeMenu()
              }}
              className="mt-auto flex items-center gap-3 px-4 py-3.5 text-base font-semibold text-gray-600 bg-brand-peach/30 border-t border-gray-100 cursor-pointer"
            >
              <IconLogout className="w-[18px] h-[18px] flex-none" />
              로그아웃
            </button>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="mt-auto flex items-center gap-3 px-4 py-3.5 text-base font-semibold text-gray-600 bg-brand-peach/30 border-t border-gray-100"
            >
              <IconLogin className="w-[18px] h-[18px] flex-none" />
              로그인
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
