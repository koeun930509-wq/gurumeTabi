import { createPortal } from 'react-dom'

// 화면 하단 중앙에 잠깐 떴다 사라지는 안내 배너 — Header/Sidebar가 각자 보유한 로컬 state(message)로
// 노출 여부를 제어하고, 이 컴포넌트는 그 state를 그대로 렌더링만 한다(전역 상태/Context 불필요 —
// "내 근처 맛집 준비중" 안내처럼 메뉴를 가진 컴포넌트 자신만 알면 되는 일회성 알림이라 과한 추상화를 피함).
// document.body에 Portal로 렌더링하는 이유는 Header 모바일 드롭다운(createPortal 사용)과 동일 —
// h-screen overflow-hidden인 페이지 안에서도 항상 최상단에 그려지게 하기 위함.
export default function Toast({ message }) {
  if (!message) return null
  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-50 px-4 py-2.5 rounded-full bg-gray-900/90 text-white text-sm font-semibold shadow-lg pointer-events-none animate-[fade-in-up_0.2s_ease-out_forwards]">
      {message}
    </div>,
    document.body,
  )
}
