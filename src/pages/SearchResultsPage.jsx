import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import RestaurantCard from '../components/RestaurantCard'
import { IconSearch } from '../components/icons'
import { mockRestaurants } from '../data/mockRestaurants'

const TRUST_FILTERS = [
  { key: 'rating35', label: '구글 평점 3.5+' },
  { key: 'noRude', label: '불친절 후기 제외' },
  { key: 'local60', label: '현지인 비율 60%+' },
  { key: 'openNow', label: '지금 영업중' },
]

const PRACTICAL_FILTERS = [
  { key: 'card', label: '카드 결제 가능' },
  { key: 'walk10', label: '역에서 도보 10분 이내' },
  { key: 'reservation', label: '예약 가능' },
]

const DEFAULT_FILTERS = {
  rating35: true,
  noRude: true,
  local60: false,
  openNow: false,
  card: false,
  walk10: false,
  reservation: false,
}

const MAX_RESULTS = 15

function trustScore(r) {
  const ratingScore = (r.rating / 5) * 50
  const localScore = (r.localRatio / 100) * 30
  const rudeScore = r.hasRudeReview ? 0 : 20
  return ratingScore + localScore + rudeScore
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') ?? ''
  const [pendingQ, setPendingQ] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  function toggle(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  const queryTokens = useMemo(() => q.split(/\s+/).filter(Boolean), [q])

  const matchedResults = useMemo(() => {
    return mockRestaurants
      .filter((r) => {
        if (
          queryTokens.length > 0 &&
          !queryTokens.every((token) => r.name.includes(token) || r.address.includes(token))
        )
          return false
        if (filters.rating35 && r.rating < 3.5) return false
        if (filters.noRude && r.hasRudeReview) return false
        if (filters.local60 && r.localRatio < 60) return false
        if (filters.openNow && r.status !== 'open') return false
        if (filters.card && !r.acceptsCard) return false
        if (filters.walk10 && r.walkMinutes > 10) return false
        if (filters.reservation && !r.acceptsReservation) return false
        return true
      })
      .sort((a, b) => trustScore(b) - trustScore(a))
  }, [filters, queryTokens])

  const results = matchedResults.slice(0, MAX_RESULTS)
  const hiddenCount = matchedResults.length - results.length

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header active="search" />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-4 p-4">
        <aside className="bg-white rounded-2xl p-5 flex flex-col gap-5 h-full overflow-y-auto">
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">
              필터 · 신뢰도
            </h4>
            <div className="flex flex-col gap-2">
              {TRUST_FILTERS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
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
                <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
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
          <button
            onClick={resetFilters}
            className="mt-auto text-xs font-bold text-gray-500 hover:text-brand-navy border border-gray-300 hover:border-brand-navy rounded-lg py-2 text-center transition-colors"
          >
            필터 초기화
          </button>
        </aside>

        <div className="h-full overflow-y-auto">
          {!q ? (
            <div className="h-full text-base text-gray-400 bg-white rounded-2xl p-10 flex flex-col items-center justify-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <IconSearch className="w-4 h-4 flex-none" />
                아직 검색을 안 하셨어요 — 지역이나 음식 종류를 입력해보세요.
              </span>
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
                  className="flex-1 text-base bg-brand-peach/40 rounded-lg px-3 py-2 outline-none focus:bg-white focus:shadow-[0_0_0_2px_rgba(168,85,247,0.4)] text-gray-900 transition-all"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-lg px-4 py-2 whitespace-nowrap"
                >
                  검색
                </button>
              </form>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full text-base text-gray-400 bg-white rounded-2xl p-6 flex items-center justify-center text-center">
              조건에 맞는 맛집이 없어요 — 필터를 다시 설정해보세요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-base text-white">
                {hiddenCount > 0
                  ? `검증 맛집 ${matchedResults.length}곳 중 신뢰도 상위 ${results.length}곳`
                  : `검증 맛집 ${results.length}곳`}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {results.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
