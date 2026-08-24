import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NearbyMap from '../components/NearbyMap'
import SearchResultCard from '../components/SearchResultCard'
import SearchResultGridCard from '../components/SearchResultGridCard'
import { IconChevronDown, IconGrid, IconList, IconLocateFixed } from '../components/icons'
import { fetchNearbyRestaurants, isDessertLikeCategory } from '../lib/restaurants'
import { isInJapan } from '../utils/geo'

// 위치 권한 요청 전에는 좌표를 전혀 알 수 없어 "일본 밖"을 미리 판단할 방법이 없다 — 그래서 메뉴 자체는
// 항상 노출하고, 이 페이지에 들어와 위치 권한을 받은 "이후"에 좌표가 일본 영역 밖이면 지도·목록 대신
// 안내만 보여주는 방식으로 차단한다.
const STATE = {
  REQUESTING: 'requesting',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  OUTSIDE_JAPAN: 'outside_japan',
  READY: 'ready',
}

// SearchResultsPage의 SORT_OPTIONS와 같은 형태(key/label/sorter)지만, "거리순"이 기본값이라는 점이 다르다 —
// fetchNearbyRestaurants가 이미 거리순으로 반환하므로 sorter가 없으면 원본 순서(거리순)를 그대로 쓴다.
const SORT_OPTIONS = [
  { key: 'distance', label: '거리순', sorter: null },
  { key: 'reviews', label: '리뷰 많은 순', sorter: (a, b) => b.reviewCount - a.reviewCount },
  { key: 'rating', label: '평점 높은 순', sorter: (a, b) => b.rating - a.rating },
]

// NearbyMap.jsx의 마커 색상 분기(식당=보라/카페류=핑크)와 동일한 2분류 — 카페/디저트/베이커리를 개별
// 카테고리로 세분화하지 않고 "카페류"로 묶었다(도보 15분 반경이라 애초에 표본이 적어서 세분화 실익이 적음).
const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'restaurant', label: '식당' },
  { key: 'cafe', label: '카페·디저트·베이커리' },
]

export default function NearbyPage() {
  // 정렬/카테고리/뷰모드를 URL 쿼리(?sort=&category=&view=)에 반영한다 — SearchResultsPage와 같은 이유:
  // 순수 useState로만 관리하면 상세 페이지 진입 후 뒤로가기로 돌아올 때 이 페이지가 재마운트되면서
  // "식당" 필터가 걸려있어도 기본값("전체")으로 리셋되는 문제가 있었다(사용자 리포트로 발견).
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(STATE.REQUESTING)
  const [userLocation, setUserLocation] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [sortBy, setSortByState] = useState(() => searchParams.get('sort') ?? 'distance')
  const [categoryFilter, setCategoryFilterState] = useState(() => searchParams.get('category') ?? 'all')
  const [viewMode, setViewModeState] = useState(() => searchParams.get('view') ?? 'grid')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)

  // 기본값일 때는 쿼리 파라미터 자체를 지워서 URL이 지저분해지지 않게 한다(SearchResultsPage와 동일 패턴).
  function setSortBy(key) {
    setSortByState(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'distance') next.delete('sort')
    else next.set('sort', key)
    setSearchParams(next, { replace: true })
  }

  function setCategoryFilter(key) {
    setCategoryFilterState(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'all') next.delete('category')
    else next.set('category', key)
    setSearchParams(next, { replace: true })
  }

  function setViewMode(mode) {
    setViewModeState(mode)
    const next = new URLSearchParams(searchParams)
    if (mode === 'grid') next.delete('view')
    else next.set('view', mode)
    setSearchParams(next, { replace: true })
  }
  const sortMenuRef = useRef(null)
  const selectedCardRef = useRef(null)
  const categoryButtonRefs = useRef({})
  const [categoryPillRect, setCategoryPillRect] = useState(null)

  // 그리드/리스트 토글(고정폭 두 칸)과 달리 이 필터는 라벨 길이가 제각각(전체/식당/카페·디저트·베이커리)이라
  // translateX 비율만으로는 슬라이딩 배경을 못 만든다 — 선택된 버튼의 실제 offsetLeft/offsetWidth를 측정해서
  // 배경 pill을 그 자리로 애니메이션 이동시킨다. 이 버튼 그룹 자체가 restaurants가 로드된 뒤에야 조건부로
  // 렌더링되므로(초기 마운트 시점엔 DOM에 없어 ref가 비어있음), restaurants.length도 의존성에 넣어서
  // 버튼이 실제로 나타나는 시점에 다시 측정한다 — 안 그러면 "전체" 배경이 처음부터 안 보이는 버그가 있었음.
  useEffect(() => {
    const el = categoryButtonRefs.current[categoryFilter]
    if (el) setCategoryPillRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [categoryFilter, restaurants.length])

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(STATE.UNSUPPORTED)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (!isInJapan(latitude, longitude)) {
          setState(STATE.OUTSIDE_JAPAN)
          return
        }
        setUserLocation({ lat: latitude, lng: longitude })
        setState(STATE.READY)
      },
      () => setState(STATE.DENIED),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    if (state !== STATE.READY || !userLocation) return
    let cancelled = false
    setLoadingRestaurants(true)
    fetchNearbyRestaurants(userLocation.lat, userLocation.lng)
      .then((data) => {
        if (!cancelled) setRestaurants(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingRestaurants(false)
      })
    return () => {
      cancelled = true
    }
  }, [state, userLocation])

  // 카테고리 필터가 바뀌면 지도에서 선택 중이던 마커가 새 필터에 없을 수 있어(예: "식당"만 남기고 다른
  // 카테고리를 골랐다가 방금 선택한 카페가 걸러짐) 정보창이 붕 뜨는 걸 막기 위해 선택을 초기화한다.
  useEffect(() => {
    setSelectedId(null)
  }, [categoryFilter])

  // 지도에서 마커를 클릭해 선택하면, 그 카드가 목록 스크롤 영역 밖에 있어도 보이도록 자동 스크롤한다 —
  // 카드 쪽 selected prop만으로는 하이라이트가 화면 밖에서 켜져도 눈에 안 띄는 문제가 있었음.
  useEffect(() => {
    if (selectedId) selectedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  // 카테고리 필터 → 정렬 순서로 적용. fetchNearbyRestaurants가 이미 거리순으로 반환하므로 "거리순"
  // (sorter: null)일 때는 그대로 두고, 다른 정렬을 고르면 그 sorter로 얕은 복사본을 정렬한다(원본 배열
  // 순서를 유지해야 "거리순"으로 되돌아갈 수 있음).
  const filteredRestaurants = useMemo(() => {
    if (categoryFilter === 'all') return restaurants
    return restaurants.filter((r) => isDessertLikeCategory(r.category) === (categoryFilter === 'cafe'))
  }, [restaurants, categoryFilter])

  const sortedRestaurants = useMemo(() => {
    const sorter = SORT_OPTIONS.find((o) => o.key === sortBy)?.sorter
    return sorter ? [...filteredRestaurants].sort(sorter) : filteredRestaurants
  }, [filteredRestaurants, sortBy])


  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header active="nearby" showSearch={false} />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 p-3 md:p-4">
        {state === STATE.READY && userLocation ? (
          <div className="h-64 md:h-full rounded-2xl overflow-hidden">
            <NearbyMap
              userLocation={userLocation}
              restaurants={filteredRestaurants}
              selectedId={selectedId}
              onSelectRestaurant={setSelectedId}
            />
          </div>
        ) : (
          <div className="h-64 md:h-full rounded-2xl bg-white flex flex-col items-center justify-center gap-4 text-center p-6">
            {state === STATE.REQUESTING && (
              <>
                <IconLocateFixed className="w-12 h-12 text-brand-coral animate-pulse" />
                <span className="text-base text-gray-500">위치 권한을 확인하고 있어요...</span>
              </>
            )}
            {state === STATE.DENIED && (
              <>
                <IconLocateFixed className="w-12 h-12 text-gray-300" />
                <span className="text-base text-gray-500">
                  위치 권한이 없으면 내 근처 맛집을 찾을 수 없어요.
                  <br />
                  브라우저 설정에서 위치 권한을 허용해주세요.
                </span>
              </>
            )}
            {state === STATE.UNSUPPORTED && (
              <span className="text-base text-gray-500">이 브라우저는 위치 정보를 지원하지 않아요.</span>
            )}
            {state === STATE.OUTSIDE_JAPAN && (
              <>
                <span className="text-5xl">🗾</span>
                <span className="text-base text-gray-500">
                  위치가 일본이 아니에요.
                  <br />
                  일본에서 접속해주세요.
                </span>
              </>
            )}
          </div>
        )}

        <div className="h-full overflow-y-scroll pretty-scroll">
          <div className="min-h-full flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap pt-3">
              <h1 className="text-xl font-bold text-gray-900 pl-2">내 근처 맛집</h1>

              {state === STATE.READY && restaurants.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      type="button"
                      onClick={() => setSortMenuOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={sortMenuOpen}
                      className={`flex items-center gap-1.5 h-10 bg-white text-xs leading-[1.25rem] font-semibold text-gray-700 rounded-full pl-4 pr-3 border outline-none cursor-pointer hover:text-brand-navy transition-colors focus-visible:border-[#9993e2] ${
                        sortMenuOpen ? 'border-[#9993e2]' : 'border-transparent'
                      }`}
                    >
                      {SORT_OPTIONS.find((o) => o.key === sortBy).label}
                      <IconChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
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
                              className={`w-full text-left text-xs leading-[1.25rem] px-4 py-2 transition-colors ${
                                sortBy === o.key ? 'bg-brand-coral/10 text-brand-coral-dark font-bold' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {o.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="relative flex items-center gap-1 h-10 bg-white rounded-full p-1">
                    {categoryPillRect && (
                      <div
                        className="absolute top-1 h-8 rounded-full bg-brand-coral transition-[left,width] duration-200 ease-out"
                        style={{ left: categoryPillRect.left, width: categoryPillRect.width }}
                      />
                    )}
                    {CATEGORY_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        ref={(el) => {
                          categoryButtonRefs.current[f.key] = el
                        }}
                        type="button"
                        onClick={() => setCategoryFilter(f.key)}
                        aria-pressed={categoryFilter === f.key}
                        className={`relative z-10 whitespace-nowrap text-xs font-semibold px-3 h-8 rounded-full cursor-pointer transition-colors ${
                          categoryFilter === f.key ? 'text-white' : 'text-gray-500 hover:text-brand-navy'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex items-center gap-1 h-10 bg-white rounded-full p-1">
                    <div
                      className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-brand-coral transition-transform duration-200 ease-out ${
                        viewMode === 'list' ? 'translate-x-[calc(100%+0.25rem)]' : 'translate-x-0'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="그리드 보기"
                      aria-pressed={viewMode === 'grid'}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        viewMode === 'grid' ? 'text-white' : 'text-gray-400 hover:text-brand-navy'
                      }`}
                    >
                      <IconGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="리스트 보기"
                      aria-pressed={viewMode === 'list'}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        viewMode === 'list' ? 'text-white' : 'text-gray-400 hover:text-brand-navy'
                      }`}
                    >
                      <IconList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {state === STATE.READY &&
              (loadingRestaurants ? (
                <div className="flex-1 min-h-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
                  <img src="/simbol.png" alt="" className="w-48 h-48 opacity-10" />
                  <span className="text-lg text-brand-navy/30">근처 맛집을 찾는 중이에요...</span>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="flex-1 min-h-0 text-base text-gray-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
                  <span className="text-5xl">🥲</span>
                  <span>도보 15분 이내에 등록된 맛집이 없어요.</span>
                </div>
              ) : sortedRestaurants.length === 0 ? (
                <div className="flex-1 min-h-0 text-base text-gray-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
                  <span className="text-5xl">🥲</span>
                  <span>이 카테고리에는 도보 15분 이내에 맛집이 없어요.</span>
                </div>
              ) : viewMode === 'list' ? (
                <div className="flex flex-col gap-4">
                  {sortedRestaurants.map((r) => (
                    <div key={r.id} ref={r.id === selectedId ? selectedCardRef : null}>
                      <SearchResultCard restaurant={r} onClick={setSelectedId} selected={r.id === selectedId} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedRestaurants.map((r) => (
                    <div key={r.id} ref={r.id === selectedId ? selectedCardRef : null}>
                      <SearchResultGridCard restaurant={r} onClick={setSelectedId} selected={r.id === selectedId} />
                    </div>
                  ))}
                </div>
              ))}

            <Footer className="mt-auto text-center text-[#999] pt-3 pb-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
