import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconStar, IconChevronRight } from './icons'

const STATUS_LABEL = {
  open: '영업중',
  closed: '휴무',
  soldout: '재료소진',
}

const STATUS_CHIP_STYLE = {
  open: 'text-status-open',
  closed: 'text-status-closed',
  soldout: 'text-status-soldout',
}

function amenityLabel(acceptsCard, acceptsReservation) {
  if (acceptsCard && acceptsReservation) return '카드 · 예약 가능'
  if (acceptsCard) return '카드 가능'
  if (acceptsReservation) return '예약 가능'
  return '정보 확인 필요'
}

export default function SearchResultGridCard({ restaurant }) {
  const navigate = useNavigate()
  const { user, scrapIds, toggleScrap } = useAuth()
  const isSaved = scrapIds.includes(restaurant.id)
  const images = restaurant.images?.length ? restaurant.images : restaurant.image ? [restaurant.image] : []
  const [photoIndex, setPhotoIndex] = useState(0)

  function goToDetail() {
    navigate(`/place/${restaurant.id}`)
  }

  function handleSaveClick(e) {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    toggleScrap(restaurant.id)
  }

  function showPrevPhoto(e) {
    e.stopPropagation()
    setPhotoIndex((i) => (i - 1 + images.length) % images.length)
  }

  function showNextPhoto(e) {
    e.stopPropagation()
    setPhotoIndex((i) => (i + 1) % images.length)
  }

  // 모바일은 hover 화살표를 쓸 수 없어서, 썸네일을 좌우로 스와이프하면 사진이 넘어가도록 터치 제스처를 추가함.
  // 카드 전체가 클릭 시 상세 페이지로 이동하는 role="link"라서, 스와이프로 판단되면(가로 이동이 세로 이동보다
  // 크고 일정 거리 이상) goToDetail로 이어지는 클릭을 막아야 함 — touchStart 시점 좌표를 저장해뒀다가
  // touchEnd에서 비교하는 방식.
  const touchStartRef = useRef(null)
  const swipedRef = useRef(false)

  function handleTouchStart(e) {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
    swipedRef.current = false
  }

  function handleTouchEnd(e) {
    const start = touchStartRef.current
    if (!start || images.length < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true
      setPhotoIndex((i) => {
        const delta = dx < 0 ? 1 : -1
        return (i + delta + images.length) % images.length
      })
    }
  }

  function handleCardClick(e) {
    if (swipedRef.current) {
      e.preventDefault()
      swipedRef.current = false
      return
    }
    goToDetail()
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') goToDetail()
      }}
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {images.length > 0 ? (
          <img
            key={photoIndex}
            src={images[photoIndex]}
            alt={restaurant.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex-col items-center justify-center gap-2 bg-[#f9f8fc]"
          style={{ display: images.length > 0 ? 'none' : 'flex' }}
        >
          <img src="/noImage.png" alt="" className="w-32 h-32 object-contain" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold text-[#666]">사진 준비중</span>
            <span className="text-xs text-gray-400">조금만 기다려주세요!</span>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={showPrevPhoto}
              aria-label="이전 사진"
              className="absolute top-1/2 left-1.5 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <IconChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={showNextPhoto}
              aria-label="다음 사진"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === photoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center h-[22px] leading-none text-[11px] font-bold text-brand-navy bg-white/90 px-2 rounded-full">
            현지인 {restaurant.localRatio}%
          </span>
          <span
            className={`inline-flex items-center h-[22px] leading-none text-[11px] font-bold bg-white/90 px-2 rounded-full ${
              STATUS_CHIP_STYLE[restaurant.status] ?? 'text-gray-700'
            }`}
          >
            {STATUS_LABEL[restaurant.status] ?? '영업중'}
          </span>
        </div>

        <button
          onClick={handleSaveClick}
          aria-label={isSaved ? '저장 해제' : '저장'}
          className={`group/star absolute top-2.5 right-2.5 flex items-center justify-center cursor-pointer ${
            isSaved ? 'text-brand-coral' : 'text-gray-400'
          }`}
        >
          <IconStar
            className="w-6 h-6 group-hover/star:stroke-brand-coral"
            fill={isSaved ? 'currentColor' : 'none'}
            strokeWidth={1}
          />
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-1">
        <div className="font-bold text-base text-gray-900 truncate">{restaurant.name}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-brand-coral-dark">★{restaurant.rating}</span>
          <span className="text-xs text-gray-400">({restaurant.reviewCount})</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-status-open">
          <span>#{restaurant.region}</span>
          <span>#{restaurant.category}</span>
          {restaurant.localRatio >= 60 && <span>#현지인방문다수</span>}
          {!restaurant.hasRudeReview && <span>#불친절후기없음</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">{restaurant.tagline}</div>
        <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-1">
          {restaurant.walkMinutes != null && (
            <span>
              {restaurant.nearestStation
                ? restaurant.nearestStation.endsWith('역')
                  ? restaurant.nearestStation
                  : `${restaurant.nearestStation}역`
                : '역'}{' '}
              도보 {restaurant.walkMinutes}분
            </span>
          )}
          <span>{amenityLabel(restaurant.acceptsCard, restaurant.acceptsReservation)}</span>
        </div>
      </div>
    </div>
  )
}
