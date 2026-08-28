import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
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
  // selectedId도 sort/category/view와 같은 이유로 URL 쿼리(?selected=)에 반영한다 — 상세 페이지 진입 후
  // 뒤로가기로 돌아오면 이 페이지가 재마운트되며 순수 useState(null)이었을 때는 선택된 가게가 지도·카드
  // 하이라이트에서 사라지는 문제가 있었다(사용자 리포트로 발견).
  const [selectedId, setSelectedIdState] = useState(() => searchParams.get('selected') ?? null)
  const [sortBy, setSortByState] = useState(() => searchParams.get('sort') ?? 'distance')
  const [categoryFilter, setCategoryFilterState] = useState(() => searchParams.get('category') ?? 'all')
  const [viewMode, setViewModeState] = useState(() => searchParams.get('view') ?? 'grid')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)

  // 기본값일 때는 쿼리 파라미터 자체를 지워서 URL이 지저분해지지 않게 한다(SearchResultsPage와 동일 패턴).
  function setSelectedId(id) {
    setSelectedIdState(id)
    const next = new URLSearchParams(searchParams)
    if (id == null) next.delete('selected')
    else next.set('selected', id)
    setSearchParams(next, { replace: true })
  }

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
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const sortMenuRef = useRef(null)
  const categoryMenuRef = useRef(null)
  const selectedCardRef = useRef(null)
  // 아래 카테고리 필터 변경 감지 effect가 "마운트 시에도" 한 번 실행되는 걸 막기 위한 이전 값 저장용 ref —
  // 단순 boolean 플래그(첫 실행이었는지)로는 React 18 StrictMode의 개발 모드 이중 마운트(mount→unmount→
  // remount)에서 오작동했다: 1차 마운트에서 플래그를 true로 세팅한 뒤 StrictMode가 즉시 재마운트하면,
  // ref 자체는 유지되므로 2차 마운트 때 "이미 마운트됨"으로 오판해 실제로 categoryFilter가 안 바뀌었는데도
  // setSelectedId(null)을 호출해버렸다(상세 페이지에서 뒤로가기 직후 ?selected= 쿼리가 사라지는 버그로
  // 발견). "이전 값과 실제로 다른지"를 비교하는 방식으로 바꿔서, 몇 번을 재실행해도 categoryFilter 값
  // 자체가 안 바뀌었으면 안전하게 skip되도록 했다.
  const prevCategoryFilterRef = useRef(categoryFilter)

  // pill 버튼 그룹(전체/식당/카페·디저트·베이커리)이 모바일 좁은 화면에서 줄바꿈되며 레이아웃이 깨지는
  // 문제가 있었음(2026-08-24 발견) — 정렬과 동일한 드롭다운 UI로 바꿔서 폭을 고정폭 버튼 하나로 줄임.
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false)
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setCategoryMenuOpen(false)
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
        // userLocation은 일본 밖이어도 항상 저장해서 지도(왼쪽)는 실제 GPS 위치로 항상 렌더링되게 한다 —
        // "일본이 아님" 판정은 오른쪽 카드 영역(맛집 목록/필터)만 전환하는 용도로 별도 관리(아래 렌더링
        // 참고). 이전엔 지도까지 통째로 안내 문구로 대체했었는데, 사용자가 "지도는 뜨고 안내는 오른쪽에만"
        // 나오길 원해서 2026-08-24에 분리함.
        setUserLocation({ lat: latitude, lng: longitude })
        setState(isInJapan(latitude, longitude) ? STATE.READY : STATE.OUTSIDE_JAPAN)
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
  // 단, 마운트 시(첫 실행)에는 건너뛴다 — 그렇지 않으면 상세 페이지에서 뒤로가기로 돌아와 URL의
  // ?selected= 쿼리가 막 복원된 직후 이 effect가 "마운트 효과"로 한 번 더 실행되어 곧바로 지워버린다.
  useEffect(() => {
    if (prevCategoryFilterRef.current === categoryFilter) return
    prevCategoryFilterRef.current = categoryFilter
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
      <Seo
        title="내 근처 맛집 — 지금 위치 기준 일본 맛집 찾기"
        description="일본 여행 중 지금 있는 위치에서 도보 15분 이내 맛집을 지도로 바로 확인하세요. GPS 기반으로 가까운 순, 평점 높은 순 정렬도 지원합니다."
        path="/nearby"
      />
      <Header active="nearby" showSearch={false} />

      {/* 모바일/태블릿은 grid가 아니라 flex-col로 바꿔서 각 자식이 자기 콘텐츠 높이만큼만 차지하게 함 —
          grid를 유지한 채 xl:grid-cols-1만 썼을 때는 grid의 기본 align-content(stretch)가 컨테이너의
          남는 세로 공간을 auto row(오른쪽/아래 컬럼)에 그대로 분배해서, "일본이 아님"처럼 짧은 안내
          문구가 있을 때도 지도와의 간격이 화면 높이만큼 벌어지는 문제가 있었음(사용자 스크린샷으로 발견).
          아이패드 프로(1024px) 등 태블릿 폭에서도 데스크톱 2열 그리드가 카드를 과하게 압축시키는 문제가
          있어(사용자 리포트), 브레이크포인트를 md(768px)에서 xl(1280px)로 올림 — xl 이상에서만 기존처럼
          2열 grid로 지도·목록이 나란히 배치됨. */}
      <div className="flex-1 min-h-0 flex flex-col xl:grid xl:grid-cols-[1fr_1fr] gap-4 p-3 xl:p-4">
        {userLocation ? (
          // 지도는 일본 밖이어도 실제 GPS 위치로 항상 렌더링한다 — "일본이 아님" 안내는 오른쪽 카드
          // 영역에서만 보여주고, 왼쪽 지도는 상태와 무관하게 내 위치 마커만 있는 상태로 표시됨(주변
          // 맛집 마커는 STATE.READY일 때만 fetchNearbyRestaurants가 채워주므로 자연히 0개로 나옴).
          <div className="flex-none h-[356px] xl:h-full rounded-2xl overflow-hidden">
            <NearbyMap
              userLocation={userLocation}
              restaurants={filteredRestaurants}
              selectedId={selectedId}
              onSelectRestaurant={setSelectedId}
            />
          </div>
        ) : (
          <div className="flex-none h-[356px] xl:h-full rounded-2xl bg-white flex flex-col items-center justify-center gap-4 text-center p-6">
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
          </div>
        )}

        {/* 모바일/태블릿에서 h-full/min-h-full을 그대로 두면 이 안쪽 flex-col이 화면 남은 공간 전체 높이를
            갖게 되고, 그 안의 flex-1(예: OUTSIDE_JAPAN 안내 블록)이 justify-center로 그 큰 공간의 정중앙에
            배치되면서 지도와의 간격이 과하게 벌어지는 문제가 있었음(사용자 스크린샷으로 발견) — xl 이상
            (지도와 나란한 2열 그리드)에서만 지도 높이에 맞춰 h-full/min-h-full을 적용하고, 그 미만은
            콘텐츠 높이만큼만 차지. */}
        <div className="xl:h-full overflow-y-scroll pretty-scroll">
          <div className="xl:min-h-full flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pt-3">
              <h1 className="text-xl font-bold text-gray-900 pl-2">내 근처 맛집</h1>

              {state === STATE.READY && restaurants.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
                  <div className="relative flex-none" ref={sortMenuRef}>
                    <button
                      type="button"
                      onClick={() => setSortMenuOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={sortMenuOpen}
                      className={`flex items-center gap-1.5 h-10 bg-white text-xs leading-[1.25rem] font-semibold text-gray-700 rounded-full pl-4 pr-3 border outline-none cursor-pointer hover:text-brand-navy transition-colors focus-visible:border-[#9993e2] whitespace-nowrap ${
                        sortMenuOpen ? 'border-[#9993e2]' : 'border-transparent'
                      }`}
                    >
                      {SORT_OPTIONS.find((o) => o.key === sortBy).label}
                      <IconChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {sortMenuOpen && (
                      <ul
                        role="listbox"
                        className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-20"
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
                              className={`w-full text-left text-xs leading-[1.25rem] px-4 py-2 whitespace-nowrap transition-colors ${
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

                  <div className="relative flex-none" ref={categoryMenuRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryMenuOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={categoryMenuOpen}
                      className={`flex items-center gap-1.5 h-10 bg-white text-xs leading-[1.25rem] font-semibold text-gray-700 rounded-full pl-4 pr-3 border outline-none cursor-pointer hover:text-brand-navy transition-colors focus-visible:border-[#9993e2] whitespace-nowrap ${
                        categoryMenuOpen ? 'border-[#9993e2]' : 'border-transparent'
                      }`}
                    >
                      {CATEGORY_FILTERS.find((f) => f.key === categoryFilter).label}
                      <IconChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {categoryMenuOpen && (
                      <ul
                        role="listbox"
                        className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-20"
                      >
                        {CATEGORY_FILTERS.map((f) => (
                          <li key={f.key}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={categoryFilter === f.key}
                              onClick={() => {
                                setCategoryFilter(f.key)
                                setCategoryMenuOpen(false)
                              }}
                              className={`w-full text-left text-xs leading-[1.25rem] px-4 py-2 whitespace-nowrap transition-colors ${
                                categoryFilter === f.key ? 'bg-brand-coral/10 text-brand-coral-dark font-bold' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {f.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="relative flex items-center gap-1 h-10 bg-white rounded-full p-1 flex-none">
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

            {state === STATE.OUTSIDE_JAPAN && (
              // xl 이상에서만 flex-1로 지도 높이만큼 늘어나 정중앙에 배치되고, 그 미만은 콘텐츠 크기만큼만
              // 차지해 지도 바로 아래 붙도록 함(위 h-full 관련 주석과 같은 이유).
              <div className="xl:flex-1 xl:min-h-0 rounded-2xl p-6 flex flex-col items-center xl:justify-center text-center gap-3">
                <span className="text-5xl">🗾</span>
                <span className="text-base text-[#333]">
                  위치가 일본이 아니에요.
                  <br />
                  일본에서 접속해주세요.
                </span>
              </div>
            )}

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
