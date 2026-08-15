import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchResultCard from "../components/SearchResultCard";
import SearchResultGridCard from "../components/SearchResultGridCard";
import { IconSearch, IconGrid, IconList, IconChevronDown, IconCheck, IconClose } from "../components/icons";
import { fetchRestaurants } from "../lib/restaurants";
import { FOOD_TYPES, normalizeJapaneseTranscription } from "../utils/searchTerms";
import SearchAutocompleteInput from "../components/SearchAutocompleteInput";

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

const MAX_RESULTS = 100;
const RESULTS_PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { key: "rating", label: "평점 높은 순", sorter: (a, b) => b.rating - a.rating },
  { key: "local", label: "현지인 비율 높은 순", sorter: (a, b) => b.localRatio - a.localRatio },
  { key: "reviews", label: "리뷰 많은 순", sorter: (a, b) => b.reviewCount - a.reviewCount },
];

function FilterSegmentGroup({ title, options, value, onChange }) {
  return (
    <div>
      <h4 className="text-[11px] tracking-wider text-gray-400 mb-2">{title}</h4>
      <div className="flex flex-nowrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`flex-none whitespace-nowrap text-[11px] font-semibold px-1.5 py-1 rounded-md border cursor-pointer transition-colors ${
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") ?? "";
  const [pendingQ, setPendingQ] = useState("");
  const [draft, setDraft] = useState(DEFAULT_FILTER_STATE);
  const [applied, setApplied] = useState(DEFAULT_FILTER_STATE);
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("grid");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);

  useEffect(() => {
    setPendingQ(q);
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
  }

  function resetFilters() {
    setDraft(DEFAULT_FILTER_STATE);
    setApplied(DEFAULT_FILTER_STATE);
  }

  const matchTokens = useMemo(() => q.split(/\s+/).filter(Boolean), [q]);

  const matchedResults = useMemo(() => {
    return restaurants
      .filter((r) => {
        if (
          matchTokens.length > 0 &&
          !matchTokens.every((token) => {
            const normalizedToken = normalizeJapaneseTranscription(token);
            return (
              normalizeJapaneseTranscription(r.name).includes(normalizedToken) ||
              normalizeJapaneseTranscription(r.category ?? "").includes(normalizedToken) ||
              normalizeJapaneseTranscription(r.region ?? "").includes(normalizedToken) ||
              r.address.includes(token)
            );
          })
        )
          return false;
        if (r.hasRudeReview) return false;
        if (r.rating < applied.ratingMin) return false;
        if (r.localRatio < applied.localMin) return false;
        if (applied.openStatus === "open" && r.status !== "open") return false;
        if (applied.openStatus === "closed" && r.status === "open") return false;
        if (applied.card && !r.acceptsCard) return false;
        // TODO(역 도보거리): walkMinutes는 아직 수집 전이라 전부 null — sync-restaurants에 가까운 역 검색+거리 계산이 붙기 전까지는 이 필터가 항상 통과됨
        if (applied.walk10 && r.walkMinutes != null && r.walkMinutes > 10) return false;
        if (applied.reservation && !r.acceptsReservation) return false;
        if (applied.foods.length > 0 && !applied.foods.includes(r.category)) return false;
        return true;
      })
      .sort(SORT_OPTIONS.find((o) => o.key === sortBy).sorter);
  }, [restaurants, applied, matchTokens, sortBy]);

  const cappedResults = matchedResults.slice(0, MAX_RESULTS);
  const results = cappedResults.slice(0, visibleCount);
  const hiddenCount = matchedResults.length - cappedResults.length;
  const hasMore = visibleCount < cappedResults.length;

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

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-4 p-4">
        <aside className="bg-white rounded-2xl p-5 flex flex-col gap-4 h-full overflow-y-auto pretty-scroll">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">필터</h3>
            <button type="button" onClick={resetFilters} className="text-xs text-gray-400 hover:text-brand-navy cursor-pointer transition-colors">
              초기화
            </button>
          </div>

          <FilterSegmentGroup title="평점" options={RATING_OPTIONS} value={draft.ratingMin} onChange={(v) => setDraftValue("ratingMin", v)} />

          <FilterSegmentGroup
            title="현지인 비율"
            options={LOCAL_RATIO_OPTIONS}
            value={draft.localMin}
            onChange={(v) => setDraftValue("localMin", v)}
          />

          <FilterSegmentGroup
            title="영업 상태"
            options={OPEN_STATUS_OPTIONS}
            value={draft.openStatus}
            onChange={(v) => setDraftValue("openStatus", v)}
          />

          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2">추가 필터</h4>
            <div className="flex flex-wrap gap-1.5">
              {PRACTICAL_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleDraftBool(f.key)}
                  aria-pressed={draft[f.key]}
                  className={`flex-none whitespace-nowrap flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors ${
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

          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-[11px] tracking-wider text-gray-400 mb-2">음식종류</h4>
            <div className="relative flex-1 min-h-0">
              <div className="h-full flex flex-col gap-2 overflow-y-auto pretty-scroll-light pr-2">
                {FOOD_TYPES.map((food) => (
                  <label key={food} className="flex items-center gap-2 text-[13px] text-gray-700 py-0.5 cursor-pointer hover:text-brand-navy">
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
              <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            className="mt-auto w-full text-sm font-bold text-brand-navy bg-brand-peach hover:bg-brand-peach-dark rounded-xl py-3 text-center cursor-pointer transition-colors"
          >
            필터 적용하기
          </button>
        </aside>

        <div className="h-full overflow-y-scroll pretty-scroll pr-4">
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
                    {hiddenCount > 0 ? `${matchedResults.length}곳 중 상위 ${results.length}곳` : `${results.length}곳`} · 광고 의심 리뷰 엄격 제외
                    적용
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-none">
                {q && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      navigate(pendingQ ? `/search?q=${encodeURIComponent(pendingQ)}` : "/search");
                    }}
                    className="flex items-center gap-1.5 h-10 rounded-full border border-transparent focus-within:border-[#9993e2] bg-white px-3 min-w-[170px]"
                  >
                    <SearchAutocompleteInput
                      value={pendingQ}
                      onChange={setPendingQ}
                      onSubmit={(picked) => navigate(`/search?q=${encodeURIComponent(picked)}`)}
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
                <span className="inline-flex items-center gap-1.5">
                  <IconSearch className="w-4 h-4 flex-none" />
                  아직 검색을 안 하셨어요 — 지역이나 음식 종류를 입력해보세요.
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    navigate(pendingQ ? `/search?q=${encodeURIComponent(pendingQ)}` : "/search");
                  }}
                  className="relative w-full max-w-sm"
                >
                  <SearchAutocompleteInput
                    value={pendingQ}
                    onChange={setPendingQ}
                    onSubmit={(picked) => navigate(`/search?q=${encodeURIComponent(picked)}`)}
                    placeholder="예: 오사카 라멘"
                    inputClassName="w-full text-left text-base bg-white rounded-full pl-6 pr-24 py-5 outline-none border border-gray-300 focus:border-brand-navy transition-colors"
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
              <div className="flex-1 min-h-0 text-base text-gray-400 bg-white rounded-2xl p-6 flex items-center justify-center text-center">
                조건에 맞는 맛집이 없어요 — 필터를 다시 설정해보세요.
              </div>
            ) : (
              <div className="relative">
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

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((v) => v + RESULTS_PAGE_SIZE)}
                    className="hidden xl:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 bottom-0 z-10 text-sm font-bold text-white bg-brand-navy/80 hover:bg-brand-navy rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.2)] cursor-pointer transition-colors whitespace-nowrap"
                  >
                    더 많은 "{headerText}" 맛집 보기
                    <IconChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + RESULTS_PAGE_SIZE)}
                className="xl:hidden self-center flex items-center gap-1.5 text-sm font-bold text-white bg-brand-navy/80 hover:bg-brand-navy rounded-full px-6 py-3 mt-2 shadow-[0_4px_12px_rgba(0,0,0,0.2)] cursor-pointer transition-colors"
              >
                더 많은 "{headerText}" 맛집 보기
                <IconChevronDown className="w-4 h-4" />
              </button>
            )}

            <Footer className="mt-auto text-center text-[#999] pt-3 pb-4 translate-y-[14px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
