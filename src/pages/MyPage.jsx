import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors flex-none ${
        checked ? 'bg-status-open' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

export default function MyPage() {
  const { user, logout, savedIds } = useAuth()
  const navigate = useNavigate()
  const [notifyOn, setNotifyOn] = useState(true)
  const [reviewAlertOn, setReviewAlertOn] = useState(false)

  return (
    <div className="min-h-full flex flex-col">
      <Header active="mypage" />

      <div className="max-w-md mx-auto w-full p-6 flex flex-col gap-6">
        <h1 className="font-bold text-lg text-brand-navy">마이페이지</h1>

        {/* 프로필 */}
        <section className="border border-gray-200 border-l-4 border-l-brand-navy rounded-lg p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-none">
            🙂
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-bold truncate">
              {user ? user.email.split('@')[0] : '게스트'}
            </span>
            <span className="text-xs text-gray-400 truncate">
              {user ? user.email : '로그인하지 않은 상태예요'}
            </span>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="mt-1.5 self-start bg-brand-coral text-white text-xs font-bold px-3 py-1.5 rounded-md"
              >
                로그인하기
              </button>
            )}
          </div>
        </section>

        {/* 활동 */}
        <section>
          <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">활동</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3.5 text-center">
              <div className="text-xl font-extrabold text-brand-navy">{savedIds.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">저장한 맛집</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3.5 text-center">
              <div className="text-xl font-extrabold text-brand-navy">3</div>
              <div className="text-xs text-gray-500 mt-0.5">최근 검색</div>
            </div>
          </div>
        </section>

        {/* 설정 · 알림 */}
        <section>
          <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">설정 · 알림</h4>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="flex items-center justify-between p-3.5">
              <span className="text-sm font-semibold">전체 알림</span>
              <Toggle checked={notifyOn} onChange={() => setNotifyOn((v) => !v)} />
            </div>
            <div className="flex items-center justify-between p-3.5">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">새 리뷰 업데이트 알림</span>
                <span className="text-xs text-gray-400">저장한 맛집에 새 리뷰가 등록되면 알림</span>
              </div>
              <Toggle checked={reviewAlertOn} onChange={() => setReviewAlertOn((v) => !v)} />
            </div>
          </div>
        </section>

        {/* 설정 · 계정 */}
        <section>
          <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">설정 · 계정</h4>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <button className="w-full text-left p-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              비밀번호 변경
            </button>
            {user ? (
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="w-full text-left p-3.5 text-sm font-semibold text-status-soldout hover:bg-gray-50"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full text-left p-3.5 text-sm font-semibold text-brand-navy hover:bg-gray-50"
              >
                로그인
              </button>
            )}
            <button className="w-full text-left p-3.5 text-sm font-semibold text-gray-400 hover:bg-gray-50">
              회원 탈퇴
            </button>
          </div>
        </section>

        {/* 정보 */}
        <section>
          <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">정보</h4>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <button className="w-full text-left p-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              이용약관
            </button>
            <button className="w-full text-left p-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              개인정보처리방침
            </button>
            <div className="flex items-center justify-between p-3.5">
              <span className="text-sm font-semibold text-gray-400">앱 버전</span>
              <span className="text-xs text-gray-400">v0.1.0 (뼈대)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
