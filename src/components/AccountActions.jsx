import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconLogout, IconUser, IconUserCircle } from './icons'

export default function AccountActions() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="로그인"
        title="로그인"
        className="text-gray-500 hover:text-brand-navy transition-colors cursor-pointer"
      >
        <IconUser className="w-7 h-7" />
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => navigate('/mypage')}
        aria-label="마이페이지"
        title="마이페이지"
        className="w-11 h-11 rounded-full overflow-hidden flex-none border border-gray-200 cursor-pointer"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="프로필 사진" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-brand-peach">
            <IconUserCircle className="w-7 h-7 text-brand-navy" />
          </span>
        )}
      </button>
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
    </>
  )
}
