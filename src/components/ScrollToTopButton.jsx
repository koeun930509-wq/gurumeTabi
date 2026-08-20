import { useEffect, useState } from 'react'
import { IconChevronDown } from './icons'

// containerRef가 있으면 그 안쪽 스크롤 컨테이너를 감시/스크롤하고(SearchResultsPage/ScrapPage/MyPage처럼
// 페이지 자체가 h-screen overflow-hidden이고 콘텐츠만 내부에서 스크롤되는 레이아웃), 없으면 window를
// 감시/스크롤한다(RestaurantDetailPage처럼 별도 스크롤 컨테이너 없이 body 스크롤을 그대로 쓰는 페이지).
export default function ScrollToTopButton({ containerRef, threshold = 400, className = 'bottom-6 right-6' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = containerRef?.current ?? window
    function handleScroll() {
      const scrollTop = containerRef?.current ? containerRef.current.scrollTop : window.scrollY
      setVisible(scrollTop > threshold)
    }
    target.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => target.removeEventListener('scroll', handleScroll)
  }, [containerRef, threshold])

  function scrollToTop() {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
      className={`fixed z-30 w-11 h-11 flex items-center justify-center rounded-full bg-brand-pink/80 text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:bg-brand-pink transition-colors cursor-pointer ${className}`}
    >
      <IconChevronDown className="w-5 h-5 rotate-180" />
    </button>
  )
}
