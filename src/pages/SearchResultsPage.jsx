import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import SearchResultCard from '../components/SearchResultCard'
import SearchResultGridCard from '../components/SearchResultGridCard'
import { IconSearch, IconGrid, IconList, IconChevronDown, IconCheck } from '../components/icons'
import { mockRestaurants } from '../data/mockRestaurants'

const FOOD_TYPES = [
  '스시', '라멘', '소바', '우동', '오코노미야키', '타코야키', '쿠시카츠', '돈부리',
  '장어덮밥', '텐동', '돈카츠', '모츠나베', '스키야키', '오뎅', '카레', '오무라이스',
  '야키소바', '몬자야키', '디저트', '카페',
]

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

const SORT_OPTIONS = [
  { key: 'recommended', label: '추천순', sorter: (a, b) => trustScore(b) - trustScore(a) },
  { key: 'rating', label: '평점순', sorter: (a, b) => b.rating - a.rating },
  { key: 'local', label: '현지인비율순', sorter: (a, b) => b.localRatio - a.localRatio },
]

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') ?? ''
  const [pendingQ, setPendingQ] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedFoods, setSelectedFoods] = useState([])
  const [sortBy, setSortBy] = useState('recommended')
  const [viewMode, setViewMode] = useState('grid')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setSelectedFoods([])
  }

  function toggleFood(food) {
    setSelectedFoods((prev) =>
      prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food]
    )
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
        if (selectedFoods.length > 0 && !selectedFoods.includes(r.category)) return false
        return true
      })
      .sort(SORT_OPTIONS.find((o) => o.key === sortBy).sorter)
  }, [filters, queryTokens, sortBy, selectedFoods])

  const results = matchedResults.slice(0, MAX_RESULTS)
  const hiddenCount = matchedResults.length - results.length

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header active="search" />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-4 p-4">
        <aside className="bg-white rounded-2xl p-5 flex flex-col gap-5 h-full overflow-y-auto pretty-scroll">
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2.5">
              필터 · 신뢰도
            </h4>
            <div className="flex flex-wrap gap-2">
              {TRUST_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key)}
                  aria-pressed={filters[f.key]}
                  className={`inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    filters[f.key]
                      ? 'bg-brand-coral text-white border-brand-coral'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-brand-navy hover:text-brand-navy'
                  }`}
                >
                  {filters[f.key] && <IconCheck className="w-3 h-3 flex-none" />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2.5">
              필터 · 여행자 실용정보
            </h4>
            <div className="flex flex-wrap gap-2">
              {PRACTICAL_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key)}
                  aria-pressed={filters[f.key]}
                  className={`inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    filters[f.key]
                      ? 'bg-brand-coral text-white border-brand-coral'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-brand-navy hover:text-brand-navy'
                  }`}
                >
                  {filters[f.key] && <IconCheck className="w-3 h-3 flex-none" />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* 음식 종류 필터 — 칩 버전 (체크박스 버전과 비교 중, 잠시 주석처리)
          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2.5">
              필터 · 음식 종류
            </h4>
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pretty-scroll pr-1">
              {FOOD_TYPES.map((food) => (
                <button
                  key={food}
                  type="button"
                  onClick={() => toggleFood(food)}
                  aria-pressed={selectedFoods.includes(food)}
                  className={`inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    selectedFoods.includes(food)
                      ? 'bg-brand-coral text-white border-brand-coral'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-brand-navy hover:text-brand-navy'
                  }`}
                >
                  {selectedFoods.includes(food) && <IconCheck className="w-3 h-3 flex-none" />}
                  {food}
                </button>
              ))}
            </div>
          </div>
          */}

          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2.5">
              필터 · 음식 종류
            </h4>
            <div className="relative flex-1 min-h-0">
              <div className="h-full flex flex-col gap-1 overflow-y-auto pretty-scroll-light pr-2">
                {FOOD_TYPES.map((food) => (
                  <label
                    key={food}
                    className="flex items-center gap-2 text-[13px] text-gray-700 py-1 cursor-pointer hover:text-brand-navy"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFoods.includes(food)}
                      onChange={() => toggleFood(food)}
                      className="w-4 h-4 accent-brand-coral rounded flex-none"
                    />
                    {food}
                  </label>
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="mt-auto text-xs font-bold text-gray-500 hover:text-brand-navy border border-gray-300 hover:border-brand-navy rounded-lg py-2 text-center transition-colors"
          >
            필터 초기화
          </button>
        </aside>

        <div className="h-full overflow-y-auto pretty-scroll pr-4">
          {!q ? (
            <div className="h-full text-base text-[#333] rounded-2xl p-10 flex flex-col items-center justify-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <IconSearch className="w-4 h-4 flex-none" />
                아직 검색을 안 하셨어요 — 지역이나 음식 종류를 입력해보세요.
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  navigate(pendingQ ? `/search?q=${encodeURIComponent(pendingQ)}` : '/search')
                }}
                className="relative w-full max-w-sm"
              >
                <input
                  value={pendingQ}
                  onChange={(e) => setPendingQ(e.target.value)}
                  placeholder="예: 오사카 라멘"
                  className="w-full text-left text-base bg-white rounded-full pl-6 pr-16 py-5 outline-none border border-gray-300 focus:border-brand-navy transition-colors"
                />
                <button
                  type="submit"
                  aria-label="검색"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-brand-coral to-brand-coral-dark hover:bg-gradient-to-br hover:from-brand-navy hover:to-brand-navy-dark text-white rounded-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.55)] hover:shadow-[0_8px_20px_-4px_rgba(76,29,149,0.7)] hover:scale-105 transition-all"
                >
                  <IconSearch className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full text-base text-gray-400 bg-white rounded-2xl p-6 flex items-center justify-center text-center">
              조건에 맞는 맛집이 없어요 — 필터를 다시 설정해보세요.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap pt-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h1 className="font-bold text-xl text-gray-900">
                    {q ? `"${q}" 검색 결과` : '전체 카테고리'}
                  </h1>
                  <div className="text-sm text-white">
                    {hiddenCount > 0
                      ? `${matchedResults.length}곳 중 신뢰도 상위 ${results.length}곳`
                      : `${results.length}곳`}{' '}
                    · 광고 의심 리뷰 엄격 제외 적용
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-none">
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      type="button"
                      onClick={() => setSortMenuOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={sortMenuOpen}
                      className="flex items-center gap-1.5 bg-white text-sm font-semibold text-gray-700 rounded-full pl-4 pr-3 py-2 outline-none cursor-pointer hover:text-brand-navy transition-colors"
                    >
                      {SORT_OPTIONS.find((o) => o.key === sortBy).label}
                      <IconChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                          sortMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {sortMenuOpen && (
                      <ul
                        role="listbox"
                        className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-20"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <li key={o.key}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={sortBy === o.key}
                              onClick={() => {
                                setSortBy(o.key)
                                setSortMenuOpen(false)
                              }}
                              className={`w-full text-left text-sm px-4 py-2 transition-colors ${
                                sortBy === o.key
                                  ? 'bg-brand-coral/10 text-brand-coral-dark font-bold'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {o.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-white rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="그리드 보기"
                      aria-pressed={viewMode === 'grid'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-brand-coral text-white'
                          : 'text-gray-400 hover:text-brand-navy'
                      }`}
                    >
                      <IconGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="리스트 보기"
                      aria-pressed={viewMode === 'list'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        viewMode === 'list'
                          ? 'bg-brand-coral text-white'
                          : 'text-gray-400 hover:text-brand-navy'
                      }`}
                    >
                      <IconList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map((r) => (
                    <SearchResultCard key={r.id} restaurant={r} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.map((r) => (
                    <SearchResultGridCard key={r.id} restaurant={r} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
