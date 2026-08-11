import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconHome, IconSearch, IconStar, IconUser, IconLogout, IconLogin } from './icons'

const MENU = [
  { to: '/', key: 'home', label: '홈', Icon: IconHome },
  { to: '/search', key: 'search', label: '검색', Icon: IconSearch },
  { to: '/saved', key: 'saved', label: '저장한 맛집', Icon: IconStar },
  { to: '/mypage', key: 'mypage', label: '마이페이지', Icon: IconUser },
]

function menuItemClass(isActive) {
  return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white'
      : 'text-gray-500 hover:bg-brand-peach/40 hover:text-brand-navy'
  }`
}

export default function Sidebar({ active }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="hidden md:flex flex-col w-60 flex-none min-h-screen bg-white/70 backdrop-blur-sm border-r border-brand-peach/60 p-5 gap-6">
      <Link to="/" className="font-extrabold text-brand-navy text-base px-1">
        Gurume Tabi
      </Link>

      <nav className="flex flex-col gap-1.5">
        {MENU.map(({ Icon, ...item }) => (
          <Link key={item.key} to={item.to} className={menuItemClass(active === item.key)}>
            <Icon className="w-[18px] h-[18px] flex-none" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        <div className="h-px bg-brand-peach/60 mb-1.5" />
        {user ? (
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-brand-peach/40 hover:text-brand-navy transition-colors"
          >
            <IconLogout className="w-[18px] h-[18px] flex-none" />
            로그아웃
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-brand-peach/40 hover:text-brand-navy transition-colors"
          >
            <IconLogin className="w-[18px] h-[18px] flex-none" />
            로그인
          </Link>
        )}
      </div>
    </aside>
  )
}
