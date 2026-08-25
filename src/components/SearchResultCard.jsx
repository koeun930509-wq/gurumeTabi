import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resolveStatusKey } from '../utils/businessHours'
import { IconPhone, IconPin, IconStar } from './icons'

const AREA_KEYWORDS = ['도톤보리', '난바', '신사이바시', '우메다']

// SearchResultGridCard와 동일한 이유(상세 페이지 Header nav를 "어디서 왔는지"에 맞게 표시)로 state.from을 실어보낸다.
const FROM_BY_PATH = {
  '/nearby': 'nearby',
  '/scrap': 'scrap',
}

const STATUS_NOTE = {
  open: '영업 중',
  closed: '휴무일 가능 · 확인 필요',
  closed_now: '영업시간 종료',
  soldout: '재료 소진 · 확인 필요',
}

const STATUS_CHIP_STYLE = {
  open: 'text-status-open bg-status-open/10',
  closed: 'text-status-closed bg-status-closed/10',
  closed_now: 'text-status-closed bg-status-closed/10',
  soldout: 'text-status-soldout bg-status-soldout/10',
}

function extractArea(address) {
  return AREA_KEYWORDS.find((k) => address.includes(k)) ?? ''
}

export default function SearchResultCard({ restaurant, onClick, selected = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, scrapIds, toggleScrap } = useAuth()
  const isSaved = scrapIds.includes(restaurant.id)
  const area = extractArea(restaurant.address)

  function handleSaveClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    toggleScrap(restaurant.id)
  }

  // onClick이 주어지면(예: "내 근처 맛집" 페이지에서 지도 마커 선택 용도) 카드 클릭이 상세 페이지 이동 대신
  // 그 콜백을 호출한다 — SearchResultGridCard와 동일한 패턴. Link의 기본 이동을 막아야 하므로 preventDefault.
  function handleClick(e) {
    if (!onClick) return
    e.preventDefault()
    onClick(restaurant.id)
  }

  return (
    <Link
      to={`/place/${restaurant.id}`}
      state={{ from: FROM_BY_PATH[location.pathname] ?? 'search' }}
      onClick={handleClick}
      className={`group relative flex gap-4 bg-white rounded-2xl overflow-hidden shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] hover:-translate-y-0.5 transition-all ${
        selected ? "after:absolute after:inset-0 after:bg-brand-coral/15 after:pointer-events-none" : ""
      }`}
    >
      <div className="relative w-[150px] self-stretch flex-none overflow-hidden">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center bg-[#f9f8fc]"
          style={{ display: restaurant.image ? 'none' : 'flex' }}
        >
          <img src="/noImage.png" alt="" className="w-28 h-28 object-contain" />
        </div>
        <button
          onClick={handleSaveClick}
          aria-label={isSaved ? '저장 해제' : '저장'}
          className={`group/star absolute top-1.5 left-1.5 flex items-center justify-center cursor-pointer ${
            isSaved ? 'text-brand-coral' : 'text-gray-300'
          }`}
        >
          <IconStar
            className="w-6 h-6 group-hover/star:stroke-brand-coral"
            fill={isSaved ? 'currentColor' : 'none'}
            strokeWidth={1}
          />
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1 py-4 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-base text-gray-900 truncate">{restaurant.name}</div>
          <div className="flex-none text-sm font-bold text-brand-coral-dark">★{restaurant.rating}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-status-open">
          <span>#{restaurant.region}</span>
          <span>#{restaurant.category}</span>
          {restaurant.localRatio >= 60 && <span>#현지인방문다수</span>}
          {!restaurant.hasRudeReview && <span>#불친절후기없음</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {area && restaurant.walkMinutes != null && `${area} 도보 ${restaurant.walkMinutes}분`}
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <IconPin className="w-3 h-3 flex-none" />
            <span className="truncate">{restaurant.address}</span>
          </span>
          <span className="inline-flex items-center gap-1 flex-none">
            <IconPhone className="w-3 h-3 flex-none" />
            {restaurant.phone}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {restaurant.isChain && (
            <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              체인점
            </span>
          )}
          {restaurant.localRatio > 0 && (
            <span className="text-[11px] font-semibold text-brand-coral-dark bg-brand-coral/10 px-2.5 py-1 rounded-full">
              현지인 추천
            </span>
          )}
          {resolveStatusKey(restaurant) !== 'unknown' && (
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                STATUS_CHIP_STYLE[resolveStatusKey(restaurant)]
              }`}
            >
              {STATUS_NOTE[resolveStatusKey(restaurant)]}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
