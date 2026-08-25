import { IconArrowLeft, IconClose, IconSearch } from './icons'
import AccountActions from './AccountActions'

function formatSearchedAt(iso) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd}.`
}

export default function MobileSearchOverlay({
  q,
  onChangeQ,
  onSubmit,
  onClose,
  recentSearches,
  onSelectRecent,
  onRemoveRecent,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(q)
        }}
        className="flex-none flex items-center gap-2 px-3 py-3 border-b border-gray-100"
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex-none min-w-9 min-h-9 w-9 h-9 flex items-center justify-center text-gray-600 cursor-pointer"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <input
          autoFocus
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="flex-1 min-w-0 text-lg outline-none placeholder:text-gray-300"
        />
        <button
          type="submit"
          aria-label="검색"
          className="flex-none min-w-9 min-h-9 w-9 h-9 flex items-center justify-center text-gray-700 cursor-pointer"
        >
          <IconSearch className="w-5 h-5" />
        </button>
        {/* 전체화면 오버레이가 Header를 완전히 덮어버려서 아바타가 안 보이던 문제(2026-08-25 리포트)
            — 오버레이 안에도 계속 보이도록 여기에 추가. AccountActions 자체가 button/Link를 렌더링하므로
            그 위를 또 button으로 감싸지 않고, onClickCapture로 클릭을 가로채 오버레이만 먼저 닫는다
            (마이페이지 이동/로그인 이동 둘 다 오버레이가 열린 채로 남는 걸 방지, showLogout=false는
            Header 모바일 아바타와 동일한 패턴). */}
        <div className="flex-none" onClickCapture={onClose}>
          <AccountActions showLogout={false} />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        {recentSearches.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-16">최근 검색 기록이 없어요.</div>
        ) : (
          recentSearches.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRecent(r.keyword)}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-50 text-left cursor-pointer hover:bg-gray-50"
            >
              <span className="text-base text-gray-800 truncate">{r.keyword}</span>
              <span className="flex-none flex items-center gap-3">
                <span className="text-sm text-gray-400">{formatSearchedAt(r.searched_at)}</span>
                <span
                  role="button"
                  aria-label="검색 기록 삭제"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRecent(r.id)
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <IconClose className="w-4 h-4" />
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
