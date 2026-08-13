import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconStar } from './icons'

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

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter') goToDetail()
      }}
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {restaurant.image ? (
          <img
            src={restaurant.image}
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
          className="w-full h-full items-center justify-center text-xs text-gray-400 bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_4px,transparent_4px,transparent_8px)]"
          style={{ display: restaurant.image ? 'none' : 'flex' }}
        >
          image ph.
        </div>

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center h-[22px] leading-none text-[11px] font-bold text-status-open bg-white/90 px-2 rounded-full">
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
          className={`group absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 cursor-pointer ${
            isSaved ? 'text-brand-coral' : 'text-gray-400'
          }`}
        >
          <IconStar
            className="w-3.5 h-3.5 group-hover:stroke-brand-coral"
            fill={isSaved ? 'currentColor' : 'none'}
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
          <span>역 도보 {restaurant.walkMinutes}분</span>
          <span>{amenityLabel(restaurant.acceptsCard, restaurant.acceptsReservation)}</span>
        </div>
      </div>
    </div>
  )
}
