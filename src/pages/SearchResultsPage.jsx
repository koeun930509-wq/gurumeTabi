import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import RestaurantCard from '../components/RestaurantCard'
import { mockRestaurants } from '../data/mockRestaurants'

const REGIONS = ['오사카', '도톤보리', '난바']

const TRUST_FILTERS = [
  { key: 'rating35', label: '구글 평점 3.5+' },
  { key: 'noRude', label: '불친절 후기 제외' },
  { key: 'local60', label: '현지인 비율 60%+' },
  { key: 'openNow', label: '지금 영업중' },
]

const PRACTICAL_FILTERS = [
  { key: 'card', label: '카드 결제 가능' },
  { key: 'walk10', label: '도보 10분 이내' },
  { key: 'reservation', label: '예약 가능' },
]

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') ?? ''
  const [pendingQ, setPendingQ] = useState('')
  const [filters, setFilters] = useState({
    rating35: true,
    noRude: true,
    local60: false,
    openNow: false,
    card: false,
    walk10: false,
    reservation: false,
  })

  function toggle(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const results = useMemo(() => {
    return mockRestaurants.filter((r) => {
      if (q && !r.name.includes(q) && !r.address.includes(q)) return false
      if (filters.rating35 && r.rating < 3.5) return false
      if (filters.noRude && r.hasRudeReview) return false
      if (filters.local60 && r.localRatio < 60) return false
      if (filters.openNow && r.status !== 'open') return false
      if (filters.card && !r.acceptsCard) return false
      if (filters.walk10 && r.walkMinutes > 10) return false
      if (filters.reservation && !r.acceptsReservation) return false
      return true
    })
  }, [filters, q])

  return (
    <div className="min-h-full flex flex-col">
      <Header active="search" />

      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr]">
        <aside className="border-r border-gray-200 border-l-4 border-l-brand-coral p-5 flex flex-col gap-5">
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">
              필터 · 신뢰도
            </h4>
            <div className="flex flex-col gap-2">
              {TRUST_FILTERS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters[f.key]}
                    onChange={() => toggle(f.key)}
                    className="accent-brand-navy"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">
              필터 · 여행자 실용정보
            </h4>
            <div className="flex flex-col gap-2">
              {PRACTICAL_FILTERS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters[f.key]}
                    onChange={() => toggle(f.key)}
                    className="accent-brand-navy"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">지역</h4>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <span
                  key={r}
                  className="text-xs bg-status-open/10 text-status-open border border-status-open rounded-full px-2.5 py-1"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="p-5 border-l-4 border-status-open">
          {!q ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md p-10 flex flex-col items-center gap-4">
              <span>🔍 아직 검색을 안 하셨어요 — 지역이나 음식 종류를 입력해보세요.</span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  navigate(pendingQ ? `/search?q=${encodeURIComponent(pendingQ)}` : '/search')
                }}
                className="flex gap-2 w-full max-w-sm"
              >
                <input
                  value={pendingQ}
                  onChange={(e) => setPendingQ(e.target.value)}
                  placeholder="예: 오사카 라멘"
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-navy text-gray-900"
                />
                <button
                  type="submit"
                  className="bg-brand-coral text-white font-bold text-sm rounded-lg px-4 py-2 whitespace-nowrap"
                >
                  검색
                </button>
              </form>
            </div>
          ) : results.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md p-6 text-center">
              조건에 맞는 맛집이 없어요 — 필터를 다시 설정해보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {results.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
