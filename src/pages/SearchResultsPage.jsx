import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchResultCard from "../components/SearchResultCard";
import SearchResultGridCard from "../components/SearchResultGridCard";
import { IconSearch, IconGrid, IconList, IconChevronDown, IconCheck, IconClose, IconFilter } from "../components/icons";
import { fetchRestaurants, fetchDessertLikeRestaurantsWithReviews } from "../lib/restaurants";
import { FOOD_TYPES, IGNORED_SEARCH_TOKENS, normalizeJapaneseTranscription, resolveSearchSynonym } from "../utils/searchTerms";
import { resolveStatusKey } from "../utils/businessHours";
import SearchAutocompleteInput from "../components/SearchAutocompleteInput";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { useAuth } from "../context/AuthContext";

const RATING_OPTIONS = [
  { value: 0, label: "전체" },
  { value: 3.0, label: "3.0+" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
];

const LOCAL_RATIO_OPTIONS = [
  { value: 0, label: "전체" },
  { value: 40, label: "40%+" },
  { value: 60, label: "60%+" },
  { value: 80, label: "80%+" },
];

const OPEN_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "open", label: "영업중" },
  { value: "closed", label: "영업종료" },
];

const PRACTICAL_FILTERS = [
  { key: "card", label: "카드 결제 가능" },
  { key: "reservation", label: "예약 가능" },
  { key: "walk10", label: "역에서 도보 10분 이내" },
];

const DEFAULT_FILTER_STATE = {
  ratingMin: 0,
  localMin: 0,
  openStatus: "all",
  card: false,
  walk10: false,
  reservation: false,
  foods: [],
};

// applied 필터를 URL 쿼리(?ratingMin=&localMin=&openStatus=&card=&walk10=&reservation=&foods=)로 직렬화/복원한다.
// 상세 페이지 이동 후 navigate(-1)로 돌아왔을 때 SearchResultsPage가 재마운트되며 draft/applied가 기본값으로
// 리셋되던 버그(예: 후쿠오카 검색 + 라멘 필터 → 상세 진입 후 뒤로가기 시 라멘 필터만 사라짐)를 URL 기반 복원으로 해결.
function filterStateFromSearchParams(searchParams) {
  const foods = searchParams.get("foods");
  return {
    ratingMin: Number(searchParams.get("ratingMin") ?? DEFAULT_FILTER_STATE.ratingMin),
    localMin: Number(searchParams.get("localMin") ?? DEFAULT_FILTER_STATE.localMin),
    openStatus: searchParams.get("openStatus") ?? DEFAULT_FILTER_STATE.openStatus,
    card: searchParams.get("card") === "1",
    walk10: searchParams.get("walk10") === "1",
    reservation: searchParams.get("reservation") === "1",
    foods: foods ? foods.split(",").filter(Boolean) : DEFAULT_FILTER_STATE.foods,
  };
}

function filterStateToSearchParamEntries(filterState) {
  const entries = [];
  if (filterState.ratingMin !== DEFAULT_FILTER_STATE.ratingMin) entries.push(["ratingMin", String(filterState.ratingMin)]);
  if (filterState.localMin !== DEFAULT_FILTER_STATE.localMin) entries.push(["localMin", String(filterState.localMin)]);
  if (filterState.openStatus !== DEFAULT_FILTER_STATE.openStatus) entries.push(["openStatus", filterState.openStatus]);
  if (filterState.card) entries.push(["card", "1"]);
  if (filterState.walk10) entries.push(["walk10", "1"]);
  if (filterState.reservation) entries.push(["reservation", "1"]);
  if (filterState.foods.length > 0) entries.push(["foods", filterState.foods.join(",")]);
  return entries;
}

const RESULTS_PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { key: "reviews", label: "리뷰 많은 순", sorter: (a, b) => b.reviewCount - a.reviewCount },
  { key: "rating", label: "평점 높은 순", sorter: (a, b) => b.rating - a.rating },
  { key: "local", label: "현지인 비율 높은 순", sorter: (a, b) => b.localRatio - a.localRatio },
];

function FilterSegmentGroup({ title, options, value, onChange }) {
  return (
    <div>
      <h4 className="text-xs md:text-[11px] tracking-wider text-gray-400 mb-2">{title}</h4>
      <div className="flex flex-nowrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`flex-none whitespace-nowrap text-xs md:text-[11px] font-semibold px-2.5 py-2 md:px-1.5 md:py-1 rounded-md border cursor-pointer transition-colors ${
                active
                  ? "bg-brand-coral text-white border-brand-coral"
                  : "bg-white text-gray-500 border-gray-300 hover:border-brand-navy hover:text-brand-navy"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRecentSearch } = useAuth();
  const q = searchParams.get("q") ?? "";
  const [pendingQ, setPendingQ] = useState("");

  function runSearch(keyword) {
    const trimmed = keyword.trim();
    if (trimmed) addRecentSearch(trimmed);
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }
  const initialFilterState = useMemo(() => filterStateFromSearchParams(searchParams), []);
  const [draft, setDraft] = useState(initialFilterState);
  const [applied, setApplied] = useState(initialFilterState);
  // 정렬·뷰모드도 필터와 같은 이유로 URL에 반영 — 상세 페이지 왕복 후 재마운트돼도 유지되도록 함
  // (예: "리뷰 많은 순"으로 정렬 후 상세 진입 → 뒤로가기 시 "평점 높은 순"으로 리셋되던 버그).
  const [sortBy, setSortByState] = useState(() => searchParams.get("sort") ?? "reviews");
  const [viewMode, setViewModeState] = useState(() => searchParams.get("view") ?? "grid");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const resultsScrollRef = useRef(null);

  // "더 보기"는 목록 끝(정적 위치)에 있어서, 클릭 시 새로 추가된 카드가 삽입되는 지점이 현재 스크롤
  // 위치 바로 아래라 그대로 두면 안 보인다 — 한 화면 높이의 80%만큼 아래로 스크롤해 바로 보이게 함
  // (정확한 새 카드 위치 계산 대신 대략적인 값으로 충분).
  function loadMoreResults() {
    setVisibleCount((v) => v + RESULTS_PAGE_SIZE);
    const el = resultsScrollRef.current;
    if (el) {
      el.scrollBy({ top: el.clientHeight * 0.8, behavior: "smooth" });
    }
  }

  function setSortBy(key) {
    setSortByState(key);
    const next = new URLSearchParams(searchParams);
    if (key === "reviews") next.delete("sort");
    else next.set("sort", key);
    setSearchParams(next, { replace: true });
  }

  function setViewMode(mode) {
    setViewModeState(mode);
    const next = new URLSearchParams(searchParams);
    if (mode === "grid") next.delete("view");
    else next.set("view", mode);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    setPendingQ(q);
  }, [q]);

  // 검색어가 바뀌면(다른 지역/음식 재검색) 이전 검색에 걸어둔 필터가 그대로 남아있던 버그가 있었음 —
  // 최초 마운트(뒤로가기·새로고침으로 URL에 필터가 이미 담겨 온 경우)는 리셋하면 안 되므로, q의 이전
  // 값을 ref로 추적해 "진짜로 검색어가 바뀐 경우"에만 필터를 기본값으로 되돌린다.
  const prevQRef = useRef(q);
  useEffect(() => {
    if (prevQRef.current !== q) {
      prevQRef.current = q;
      resetFilters();
    }
  }, [q]);

  // 검색어/필터/정렬이 바뀌면 "더 보기"로 늘려둔 개수를 다시 첫 페이지로 되돌린다.
  useEffect(() => {
    setVisibleCount(RESULTS_PAGE_SIZE);
  }, [q, applied, sortBy]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRestaurants()
      .then((data) => {
        if (!cancelled) setRestaurants(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function setDraftValue(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDraftBool(key) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleDraftFood(food) {
    setDraft((prev) => ({
      ...prev,
      foods: prev.foods.includes(food) ? prev.foods.filter((f) => f !== food) : [...prev.foods, food],
    }));
  }

  function applyFilters() {
    setApplied(draft);
    const next = new URLSearchParams(searchParams);
    Object.keys(DEFAULT_FILTER_STATE).forEach((key) => next.delete(key));
    filterStateToSearchParamEntries(draft).forEach(([key, value]) => next.set(key, value));
    setSearchParams(next, { replace: true });
    setMobileFilterOpen(false);
  }

  function resetFilters() {
    setDraft(DEFAULT_FILTER_STATE);
    setApplied(DEFAULT_FILTER_STATE);
    const next = new URLSearchParams(searchParams);
    ["ratingMin", "localMin", "openStatus", "card", "walk10", "reservation", "foods"].forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }

  // 모바일 필터 버튼에 표시할 배지 — 몇 개의 필터가 현재 결과에 실제로 적용(applied) 중인지 센다.
  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (applied.ratingMin !== DEFAULT_FILTER_STATE.ratingMin) count += 1;
    if (applied.localMin !== DEFAULT_FILTER_STATE.localMin) count += 1;
    if (applied.openStatus !== DEFAULT_FILTER_STATE.openStatus) count += 1;
    if (applied.card) count += 1;
    if (applied.walk10) count += 1;
    if (applied.reservation) count += 1;
    count += applied.foods.length;
    return count;
  }, [applied]);

  // IGNORED_SEARCH_TOKENS(예: "맛집", 라멘 육수 세부 키워드)는 실제 데이터(가게명/카테고리/지역/주소)에
  // 나타나지 않는 수식어라 매칭 토큰에서 제외한다 — 안 그러면 "도쿄 맛집"·"쇼유 라멘"처럼 검색했을 때 그
  // 토큰이 매칭 실패해 0건이 됨. 제외 후 "라멘"만 남으면 라멘 카테고리 전체가 결과로 나오는 폴백이 된다.
  const matchTokens = useMemo(
    () =>
      q
        .split(/\s+/)
        .filter((token) => token && !IGNORED_SEARCH_TOKENS.has(token))
        .map(resolveSearchSynonym),
    [q]
  );

  function matchesTokens(r, includeReviews) {
    if (matchTokens.length === 0) return true;
    return matchTokens.every((token) => {
      const normalizedToken = normalizeJapaneseTranscription(token);
      const textMatch =
        normalizeJapaneseTranscription(r.name).includes(normalizedToken) ||
        normalizeJapaneseTranscription(r.category ?? "").includes(normalizedToken) ||
        normalizeJapaneseTranscription(r.region ?? "").includes(normalizedToken) ||
        r.address.includes(token);
      if (textMatch || !includeReviews) return textMatch;
      return (r.reviews ?? []).some(
        (rv) =>
          normalizeJapaneseTranscription(rv.snippet ?? "").includes(normalizedToken) ||
          normalizeJapaneseTranscription(rv.tasteSnippet ?? "").includes(normalizedToken)
      );
    });
  }

  function passesFilters(r) {
    if (r.hasRudeReview) return false;
    if (r.rating < applied.ratingMin) return false;
    if (r.localRatio < applied.localMin) return false;
    // 영업 상태를 알 수 없는 가게("unknown", opening_hours 미수집)는 어느 필터에도 걸리지 않고
    // 항상 통과시킨다 — "영업중"이라고 단정할 근거가 없다고 해서 검색 결과에서 아예 빼버리면
    // opening_hours가 없는 약 15%의 가게가 영업상태 필터를 걸 때마다 전부 숨겨지는 게 더 나쁨.
    const statusKey = resolveStatusKey(r);
    if (applied.openStatus === "open" && statusKey !== "open" && statusKey !== "unknown") return false;
    if (applied.openStatus === "closed" && statusKey === "open") return false;
    if (applied.card && !r.acceptsCard) return false;
    // TODO(역 도보거리): walkMinutes는 아직 수집 전이라 전부 null — sync-restaurants에 가까운 역 검색+거리 계산이 붙기 전까지는 이 필터가 항상 통과됨
    if (applied.walk10 && r.walkMinutes != null && r.walkMinutes > 10) return false;
    if (applied.reservation && !r.acceptsReservation) return false;
    if (applied.foods.length > 0 && !applied.foods.includes(r.category)) return false;
    return true;
  }

  const textMatchedResults = useMemo(() => {
    return restaurants.filter((r) => matchesTokens(r, false) && passesFilters(r));
  }, [restaurants, applied, matchTokens]);

  // 가게명/카테고리/지역/주소로 매칭된 게 하나도 없을 때만, 카페/디저트/베이커리 후보를 리뷰까지
  // 조회해서(fetchDessertLikeRestaurantsWithReviews) "케이크"처럼 메뉴가 리뷰에만 언급된 경우를 찾는다.
  // 전체 가게를 리뷰까지 조회하면 쿼리 타임아웃이 나서(위 fetchRestaurants 주석 참고) 후보를 미리 좁혀둠.
  const [reviewMatchedResults, setReviewMatchedResults] = useState([]);
  useEffect(() => {
    if (textMatchedResults.length > 0 || matchTokens.length === 0) {
      setReviewMatchedResults([]);
      return;
    }
    let cancelled = false;
    fetchDessertLikeRestaurantsWithReviews()
      .then((data) => {
        if (cancelled) return;
        setReviewMatchedResults(data.filter((r) => matchesTokens(r, true) && passesFilters(r)));
      })
      .catch(() => {
        if (!cancelled) setReviewMatchedResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [textMatchedResults.length, matchTokens, applied]);

  const matchedResults = useMemo(() => {
    const base = textMatchedResults.length > 0 ? textMatchedResults : reviewMatchedResults;
    return [...base].sort(SORT_OPTIONS.find((o) => o.key === sortBy).sorter);
  }, [textMatchedResults, reviewMatchedResults, sortBy]);

  const results = matchedResults.slice(0, visibleCount);
  const hasMore = visibleCount < matchedResults.length;

  // 헤더에 보여줄 텍스트 — 검색창에 입력한 검색어에 필터로 고른 음식종류를 이어붙인다.
  // 검색어에 이미 같은 단어가 들어있으면 중복으로 안 붙임.
  const headerText = useMemo(() => {
    const parts = q ? [q] : [];
    const extraTerms = applied.foods.filter((term) => !parts.some((p) => p.includes(term)));
    return [...parts, ...extraTerms].join(" ");
  }, [q, applied.foods]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header active="search" showSearch={false} />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-4 p-3 md:p-4">
        {/* 모바일(md 미만)에서는 필터 패널이 항상 펼쳐진 채 전체 폭을 차지해 결과가 안 보이던 문제가 있었음 —
            기본은 숨기고(hidden md:flex), "필터" 토글 버튼을 누르면 전체화면 오버레이로 띄우는 방식으로 변경.
            PC(md+)에서는 기존과 동일하게 항상 보이는 좌측 사이드바로 렌더링됨. */}
        {/* 모바일 오버레이 구조: aside 자체는 패딩 없는 껍데기(고정 위치)이고, 내부를 스크롤 콘텐츠 영역(flex-1
            overflow-y-auto, 자체 패딩)과 하단 고정 영역(flex-none, 자체 패딩)으로 분리함. sticky를 패딩이 있는
            컨테이너에 직접 걸면 sticky 기준이 padding box가 아니라 border box라 버튼 아래 패딩만큼 카드 밖으로
            비어져 보이는 문제가 있었음 — 그래서 sticky 대신 버튼을 아예 스크롤 영역 밖 별도 flex-none 블록으로
            분리해 항상 카드 안에 있도록 함. PC(md+)는 기존과 동일하게 항상 펼쳐진 사이드바로 렌더링됨.
            하단(bottom)만 top/left/right(1rem)보다 훨씬 크게(2rem) 잡은 이유: 카카오톡 인앱 브라우저 같은
            모바일 웹뷰는 100vh를 주소창 포함 전체 높이로 계산해 fixed 요소가 실제 화면 하단 시스템 제스처
            바보다 낮게 배치되는 문제가 있었음(env(safe-area-inset-bottom)도 이런 웹뷰에서는 0으로 무효화됨) —
            inset-4 대신 개별 방향 지정으로 최하단에 물리적 여유 공간을 고정 확보함. */}
        <aside
          className={`bg-white rounded-2xl overflow-hidden flex-col md:h-full md:p-5 md:gap-1 md:flex ${
            mobileFilterOpen ? "fixed top-4 left-4 right-4 bottom-8 z-30 flex" : "hidden"
          }`}
        >
          <div className="flex-1 min-h-0 overflow-y-auto pretty-scroll p-5 pb-0 md:p-0 md:contents flex flex-col gap-4 md:gap-0">
            <div className="flex items-center justify-between md:mb-4">
              <h3 className="text-lg md:text-base font-bold text-gray-900">필터</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm md:text-xs text-gray-400 hover:text-brand-navy cursor-pointer transition-colors"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="필터 닫기"
                  className="md:hidden text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <IconClose className="w-[22.4px] h-[22.4px]" />
                </button>
              </div>
            </div>

            <div className="md:mb-4">
              <FilterSegmentGroup title="평점" options={RATING_OPTIONS} value={draft.ratingMin} onChange={(v) => setDraftValue("ratingMin", v)} />
            </div>

            <div className="md:mb-4">
              <FilterSegmentGroup
                title="현지인 비율"
                options={LOCAL_RATIO_OPTIONS}
                value={draft.localMin}
                onChange={(v) => setDraftValue("localMin", v)}
              />
            </div>

            <div className="md:mb-4">
              <FilterSegmentGroup
                title="영업 상태"
                options={OPEN_STATUS_OPTIONS}
                value={draft.openStatus}
                onChange={(v) => setDraftValue("openStatus", v)}
              />
            </div>

            <div className="md:mb-4">
              <h4 className="text-xs md:text-[11px] tracking-wider text-gray-400 mb-2">추가 필터</h4>
              <div className="flex flex-wrap gap-0.5 md:gap-1.5">
                {PRACTICAL_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleDraftBool(f.key)}
                    aria-pressed={draft[f.key]}
                    className={`flex-none whitespace-nowrap flex items-center gap-1 text-xs md:text-[11px] font-semibold px-1.5 py-2.5 md:px-2.5 md:py-1.5 rounded-md border cursor-pointer transition-colors ${
                      draft[f.key]
                        ? "bg-brand-coral text-white border-brand-coral"
                        : "bg-white text-gray-500 border-gray-300 hover:border-brand-navy hover:text-brand-navy"
                    }`}
                  >
                    {draft[f.key] && <IconCheck className="w-3 h-3 flex-none" />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pb-4 md:pb-0 md:flex-1 flex flex-col md:min-h-0">
              <h4 className="text-xs md:text-[11px] tracking-wider text-gray-400 mb-2">음식종류</h4>
              {/* 모바일은 2열 그리드로 배치해 세로 길이를 절반으로 줄이고, 카드 자체 스크롤에 맡김(고정/가변 높이
                  계산 없음). PC(md+)는 기존처럼 1열 세로 목록 + 사이드바 남는 공간을 자체 스크롤로 채우는 방식 유지. */}
              <div className="relative md:flex-1 md:min-h-0">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 md:flex md:flex-col md:gap-2 md:h-full md:overflow-y-auto pretty-scroll-light md:pr-2">
                  {FOOD_TYPES.map((food) => (
                    <label
                      key={food}
                      className="flex items-center gap-2 text-sm md:text-[13px] text-gray-700 py-1.5 md:py-0.5 cursor-pointer hover:text-brand-navy"
                    >
                      <input
                        type="checkbox"
                        checked={draft.foods.includes(food)}
                        onChange={() => toggleDraftFood(food)}
                        className="w-4 h-4 accent-brand-coral rounded flex-none"
                      />
                      {food}
                    </label>
                  ))}
                </div>
                <div className="hidden md:block pointer-events-none absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent" />
              </div>
            </div>
          </div>

          {/* 안드로이드 제스처 네비게이션 바처럼 화면 하단을 가리는 시스템 UI가 있는 실기기에서, fixed 위치의
              카드는 그 안전 영역(safe area)을 자동으로 피하지 않아 버튼이 그 바로 위에 붙어 잘려 보이는 문제가
              있었음(데스크톱 브라우저 에뮬레이션에는 이 UI가 없어서 재현이 안 됐음) — mobile-safe-bottom 클래스
              (index.css)로 env(safe-area-inset-bottom)만큼 하단 패딩을 모바일에서만 추가 확보함. */}
          <div className="flex-none p-5 pt-4 md:p-0 md:pt-4 mobile-safe-bottom">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full text-base md:text-sm font-bold text-brand-navy bg-brand-peach hover:bg-brand-peach-dark rounded-xl py-4 md:py-3 text-center cursor-pointer transition-colors"
            >
              필터 적용하기
            </button>
          </div>
        </aside>
        {mobileFilterOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
        )}

        {/* pb-[68px] — 맨 위로 버튼(44px 높이 + bottom-6=24px)은 fixed라 레이아웃 공간을 차지하지 않고
            뷰포트 기준으로 떠 있어서, 끝까지 스크롤하면 그 자리에 Footer 텍스트가 그대로 겹쳐 보이던
            문제가 있었음. 스크롤 컨테이너에 버튼 크기만큼 딱 맞춘 여유 공간을 예약해 방지함(이보다
            줄이면 다시 겹칠 수 있음). */}
        <div ref={resultsScrollRef} className="h-full overflow-y-scroll pretty-scroll md:pr-4 pb-[68px]">
          <div className="min-h-full flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap pt-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-xl text-gray-900 pl-2">
                  {headerText ? (
                    <>
                      <span className="font-bold">"{headerText}"</span> 검색 결과
                    </>
                  ) : (
                    <span className="font-bold">검색</span>
                  )}
                </h1>
                {q && results.length > 0 && (
                  <div className="text-sm text-white">
                    {results.length < matchedResults.length
                      ? `${matchedResults.length}곳 중 상위 ${results.length}곳`
                      : `${results.length}곳`}{" "}
                    · 광고 의심 리뷰 엄격 제외 적용
                  </div>
                )}
              </div>

              {/* 재검색 input(min-w-[170px])을 필터·정렬·보기토글과 하나의 wrapper로 묶어서(justify-between
                  적용 시 자식이 항상 2개가 되도록) 제목 블록은 왼쪽, 이 wrapper는 오른쪽에 붙도록 함 — 예전에
                  재검색 폼을 별도 형제로 분리했더니 justify-between이 3개 자식을 균등 분산시켜 재검색 폼이
                  PC에서 화면 중앙에 붕 뜨는 버그가 있었음. wrapper 안에서는 flex-wrap으로, 모바일은 재검색
                  폼이 항상 다음 줄에 w-full로 내려가고(가로 스크롤 방지), PC(md+)는 한 줄로 자연스럽게 이어짐. */}
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
                {q && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runSearch(pendingQ);
                    }}
                    className="order-3 md:order-none w-full md:w-auto flex items-center gap-1.5 h-10 rounded-full border border-transparent focus-within:border-[#9993e2] bg-white px-3 md:min-w-[170px]"
                  >
                    <SearchAutocompleteInput
                      value={pendingQ}
                      onChange={setPendingQ}
                      onSubmit={runSearch}
                      placeholder="지역·음식 검색"
                      inputClassName="bg-transparent outline-none text-sm text-gray-600 w-full placeholder:text-xs"
                      wrapperClassName="relative flex-1"
                      listClassName="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-30 overflow-hidden"
                    />
                    {pendingQ && (
                      <button
                        type="button"
                        aria-label="검색어 지우기"
                        onClick={() => setPendingQ("")}
                        className="flex-none text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <IconClose className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <IconSearch className="w-3.5 h-3.5 text-gray-400 flex-none" />
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="필터"
                  className="md:hidden relative flex items-center justify-center w-10 h-10 bg-white text-gray-700 rounded-full cursor-pointer hover:text-brand-navy transition-colors"
                >
                  <IconFilter className="w-4 h-4" />
                  {appliedFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-coral text-white text-[10px] font-bold">
                      {appliedFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={sortMenuRef}>
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={sortMenuOpen}
                    className={`flex items-center gap-1.5 h-10 bg-white text-xs leading-[1.25rem] font-semibold text-gray-700 rounded-full pl-4 pr-3 border outline-none cursor-pointer hover:text-brand-navy transition-colors focus-visible:border-[#9993e2] ${
                      sortMenuOpen ? "border-[#9993e2]" : "border-transparent"
                    }`}
                  >
                    {SORT_OPTIONS.find((o) => o.key === sortBy).label}
                    <IconChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
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
                              setSortBy(o.key);
                              setSortMenuOpen(false);
                            }}
                            className={`w-full text-left text-xs leading-[1.25rem] px-4 py-2 transition-colors ${
                              sortBy === o.key ? "bg-brand-coral/10 text-brand-coral-dark font-bold" : "text-gray-600 hover:bg-gray-50"
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
                  <div
                    className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-brand-coral transition-transform duration-200 ease-out ${
                      viewMode === "list" ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label="그리드 보기"
                    aria-pressed={viewMode === "grid"}
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      viewMode === "grid" ? "text-white" : "text-gray-400 hover:text-brand-navy"
                    }`}
                  >
                    <IconGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label="리스트 보기"
                    aria-pressed={viewMode === "list"}
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      viewMode === "list" ? "text-white" : "text-gray-400 hover:text-brand-navy"
                    }`}
                  >
                    <IconList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {!q ? (
              <div className="flex-1 min-h-0 text-base text-[#333] rounded-2xl p-10 flex flex-col items-center justify-center gap-4">
                <span className="text-center">
                  아직 검색을 안 하셨어요
                  <br />
                  지역이나 음식종류로 검색해보세요.
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch(pendingQ);
                  }}
                  className="relative w-full max-w-sm"
                >
                  <SearchAutocompleteInput
                    value={pendingQ}
                    onChange={setPendingQ}
                    onSubmit={runSearch}
                    placeholder="예: 오사카 라멘"
                    inputClassName="w-full text-left text-base bg-white rounded-full pl-6 pr-24 py-4 outline-none border border-gray-300 focus:border-brand-navy transition-colors"
                  />
                  {pendingQ && (
                    <button
                      type="button"
                      aria-label="검색어 지우기"
                      onClick={() => setPendingQ("")}
                      className="absolute right-16 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                    >
                      <IconClose className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label="검색"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-brand-coral to-brand-coral-dark hover:bg-gradient-to-br hover:from-brand-navy hover:to-brand-navy-dark text-white rounded-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.55)] hover:shadow-[0_8px_20px_-4px_rgba(76,29,149,0.7)] hover:scale-105 transition-all"
                  >
                    <IconSearch className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : loading ? (
              <div className="flex-1 min-h-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
                <img src="/simbol.png" alt="" className="w-48 h-48 opacity-10" />
                <span className="text-lg text-brand-navy/30">맛집을 불러오는 중이에요...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex-1 min-h-0 text-base text-gray-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-5xl">🥲</span>
                <span>
                  조건에 맞는 맛집이 없어요.
                  <br />
                  필터를 다시 설정해보세요.
                </span>
              </div>
            ) : (
              <>
                {viewMode === "list" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
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
              </>
            )}

            {/* 예전엔 sticky로 스크롤 내내 화면 하단에 떠 있었는데, 그러면 스크롤하는 동안 계속 카드 사진
                위에 버튼이 겹쳐 보이는 문제가 있었음(2026-08-20 피드백) — 일반 배치로 바꿔서 목록 끝까지
                스크롤했을 때(마지막 카드 다음, Footer 앞)만 보이도록 함. headerText가 비어있는 검색 전
                기본 목록(q도 음식 필터도 없을 때)에는 버튼 문구가 `더 많은 "" 맛집 보기`처럼 빈 따옴표로
                보이므로, 검색이 실제로 실행된 경우(headerText가 있을 때)에만 노출함. */}
            {hasMore && headerText && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreResults}
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-brand-navy/80 hover:bg-brand-navy rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.25)] cursor-pointer transition-colors whitespace-nowrap"
                >
                  더 많은 "{headerText}" 맛집 보기
                  <IconChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            <Footer className="mt-auto text-center text-[#999] pt-3 pb-4 translate-y-[14px]" />
          </div>
        </div>
      </div>
      {/* right만 모바일 콘텐츠 여백(grid의 p-3=12px)에 맞춰 안쪽으로 당김 — "더 보기" 버튼이 이제
          sticky가 아니라 목록 끝에서만 나타나므로 bottom을 그 버튼에 맞춰 정렬할 필요는 없어짐. */}
      <ScrollToTopButton containerRef={resultsScrollRef} className="right-3 md:right-6 bottom-6" />
    </div>
  );
}
