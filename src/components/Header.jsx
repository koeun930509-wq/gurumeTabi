import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const { user, logout, addRecentSearch } = useAuth()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)
  const [navHeight, setNavHeight] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  // 스크롤을 조금이라도 내리면 헤더가 sticky로 화면 상단에 붙어있는 상태에서 얇게 줄어들도록
  // — 페이지 자체(window)가 스크롤되는 화면(상세 페이지 등)에서만 발동함. 검색결과/마이페이지/스크랩처럼
  // h-screen overflow-hidden으로 내부 컨테이너만 스크롤되는 화면에서는 window 스크롤이 발생하지 않아
  // 이 효과가 적용되지 않음(의도된 범위).
  // on/off 임계값을 다르게 둬서(진입 40px / 해제 15px) 스크롤이 경계값 근처에서 미세하게 오르내릴 때
  // scrolled 상태가 반복적으로 뒤집히며 애니메이션이 떨리는 걸 방지함(히스테리시스).
  useEffect(() => {
    function handleScroll() {
      setScrolled((prev) => {
        if (window.scrollY > 40) return true
        if (window.scrollY < 15) return false
        return prev
      })
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 모바일 드롭다운 메뉴가 화면 최하단까지 정확히 채워지도록, nav의 실제 렌더링 높이를 측정해서 드롭다운의
  // top 계산에 씀 — 이전에는 min-h-[calc(100vh-92px)]처럼 헤더 높이를 매직넘버로 하드코딩했는데, 헤더
  // 상하 padding을 py-6→py-4로 줄이면서 실제 높이(약 76px)와 이 매직넘버(92px)가 어긋나 메뉴가 화면
  // 최하단에 못 미치고 짧게 끝나는 버그가 났었음. getBoundingClientRect().height(border box, padding
  // 포함)를 써야 함 — ResizeObserver의 contentRect.height는 padding을 뺀 값이라 로고 자체 높이(43px)만
  // 잡히고 위아래 padding(32px)이 빠져서 드롭다운이 로고 절반을 가리는 버그가 있었음.
  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    function measure() {
      setNavHeight(el.getBoundingClientRect().height)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function runSearch(keyword) {
    const trimmed = keyword.trim()
    if (trimmed) addRecentSearch(trimmed)
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  function handleSearch(e) {
    e.preventDefault()
    runSearch(q)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav
      ref={navRef}
      className={`sticky top-0 flex items-center gap-6 px-4 sm:px-6 bg-white shadow-[0_4px_16px_-4px_rgba(109,40,217,0.15)] z-20 transition-[padding] duration-300 ease-in-out ${
        scrolled ? 'py-[14.4px] sm:py-[21.6px]' : 'py-4 sm:py-6'
      }`}
    >
      <Link to="/" className="flex-none">
        <img
          src="/logo.png"
          alt="Gurume Tabi"
          className={`w-auto transition-[height] duration-300 ease-in-out ${
            scrolled ? 'h-[38.88px] sm:h-[43.2px]' : 'h-[43.2px] sm:h-12'
          }`}
        />
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
            onSubmit={runSearch}
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
        <div className="md:hidden flex items-center translate-x-2">
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

      {/* 모바일 드롭다운 메뉴 — document.body에 Portal로 렌더링함. nav 내부(또는 검색 결과 페이지의
          h-screen overflow-hidden 컨테이너) 안에 그대로 두면, 일부 모바일 브라우저가 overflow:hidden인
          조상을 position:fixed 자식의 containing block으로 취급해서 그 조상 밖으로 못 나가고 페이지의
          다른 z-index 요소(검색 결과 그리드/리스트 토글 버튼 등)에 가려지는 실기기 전용 버그가 있었음
          (데스크톱 브라우저 에뮬레이션에서는 재현 안 됨). body 최상위로 옮기면 어떤 조상의 overflow/
          stacking context와도 무관하게 항상 최상단에 그려짐.
          top(실측한 navHeight)/bottom:0으로 위치를 잡아서 화면 최하단까지 정확히 채움 — height 대신
          top+bottom 조합을 쓰는 이유는 100vh가 모바일 브라우저(특히 인앱 웹뷰)에서 주소창 포함 전체
          높이로 계산되어 실제 화면보다 크게 잡히는 문제가 있었기 때문(이전 필터 오버레이 버그와 동일 원인). */}
      {menuOpen &&
        createPortal(
          <div
            className={`fixed left-0 right-0 bottom-0 md:hidden bg-white border-b border-gray-200 shadow-md z-40 flex flex-col ${
              navHeight === 0 ? 'top-[75px]' : ''
            }`}
            style={navHeight > 0 ? { top: navHeight } : undefined}
          >
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
          </div>,
          document.body,
        )}
    </nav>
  )
}
