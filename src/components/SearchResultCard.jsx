import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconPhone, IconPin, IconStar } from './icons'

const AREA_KEYWORDS = ['도톤보리', '난바', '신사이바시', '우메다']

const STATUS_NOTE = {
  open: '영업 중 (추정)',
  closed: '휴무일 가능 · 확인 필요',
  soldout: '재료 소진 · 확인 필요',
}

const STATUS_CHIP_STYLE = {
  open: 'text-status-open bg-status-open/10',
  closed: 'text-status-closed bg-status-closed/10',
  soldout: 'text-status-soldout bg-status-soldout/10',
}

function extractArea(address) {
  return AREA_KEYWORDS.find((k) => address.includes(k)) ?? ''
}

export default function SearchResultCard({ restaurant }) {
  const { savedIds } = useAuth()
  const isSaved = savedIds.includes(restaurant.id)
  const adFilteredCount = restaurant.reviews.filter((r) => r.isAdFiltered).length
  const area = extractArea(restaurant.address)

  return (
    <Link
      to={`/place/${restaurant.id}`}
      className="flex gap-4 bg-white rounded-2xl p-4 shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] hover:-translate-y-0.5 transition-all"
    >
      <div className="relative w-28 h-28 flex-none rounded-xl overflow-hidden">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center text-[10px] text-gray-400 bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_4px,transparent_4px,transparent_8px)]"
          style={{ display: restaurant.image ? 'none' : 'flex' }}
        >
          image ph.
        </div>
        <span
          className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-white/90 ${
            isSaved ? 'text-brand-coral' : 'text-gray-300'
          }`}
        >
          <IconStar className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-base text-gray-900 truncate">{restaurant.name}</div>
          <div className="flex-none text-sm font-bold text-brand-coral-dark">★{restaurant.rating}</div>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {[restaurant.category, area && `${area} 도보 ${restaurant.walkMinutes}분`]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
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
          <span className="text-[11px] font-semibold text-brand-coral-dark bg-brand-coral/10 px-2.5 py-1 rounded-full">
            광고 {adFilteredCount}건 제외
          </span>
          <span className="text-[11px] font-semibold text-brand-coral-dark bg-brand-coral/10 px-2.5 py-1 rounded-full">
            현지인 {restaurant.localRatio}% 추정
          </span>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              STATUS_CHIP_STYLE[restaurant.status] ?? 'text-gray-500 bg-gray-100'
            }`}
          >
            {STATUS_NOTE[restaurant.status] ?? '영업시간 기준 추정'}
          </span>
        </div>
      </div>
    </Link>
  )
}
