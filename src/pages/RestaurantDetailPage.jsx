import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import ReviewCard from "../components/ReviewCard";
import {
  IconArrowLeft,
  IconCake,
  IconChevronRight,
  IconClock,
  IconExternalLink,
  IconLink,
  IconPhone,
  IconPin,
  IconShare,
  IconStar,
  IconWallet,
} from "../components/icons";
import { fetchBackupPlan, fetchNearbyDessert, fetchRestaurantById } from "../lib/restaurants";
import { resolveStatusKey } from "../utils/businessHours";
import { useAuth } from "../context/AuthContext";

function googleMapEmbedSrc(lat, lng, zoom = 16) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;
  return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${lat}%2C${lng}&zoom=${zoom}`;
}

const STATUS_PILL = {
  open: { label: "영업중", className: "text-status-open bg-status-open/10" },
  closed: { label: "휴무", className: "text-status-closed bg-status-closed/10" },
  closed_now: { label: "영업종료", className: "text-status-closed bg-status-closed/10" },
  soldout: { label: "재료소진", className: "text-status-soldout bg-status-soldout/10" },
};

// 구글 리뷰가 항상 먼저, 네이버가 항상 나중에 나오던 걸 섞기 위한 Fisher-Yates 셔플 — 페이지를
// 새로 불러올 때마다(useMemo 의존성이 리뷰 배열 자체) 한 번만 섞이고, 리렌더링 중에는 순서가
// 유지되어 사용자가 읽던 리뷰가 갑자기 움직이지 않는다.
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// SearchResultGridCard의 필름스트립 캐러셀과 동일한 방식(엘리먼트를 유지한 채 transform만 애니메이션)을
// 상세 페이지 크기에 맞게 재사용. 그리드 카드와 동일하게 최대 5장(restaurant.images)까지만 보여준다.
function PhotoCarousel({ images, name }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartRef = useRef(null);

  function showPrevPhoto(e) {
    e.stopPropagation();
    setPhotoIndex((i) => (i - 1 + images.length) % images.length);
  }

  function showNextPhoto(e) {
    e.stopPropagation();
    setPhotoIndex((i) => (i + 1) % images.length);
  }

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    const start = touchStartRef.current;
    if (!start || images.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      setPhotoIndex((i) => {
        const delta = dx < 0 ? 1 : -1;
        return (i + delta + images.length) % images.length;
      });
    }
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#f9f8fc] flex flex-col items-center justify-center gap-2">
        <img src="/noImage.png" alt="" className="w-32 h-32 object-contain" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold text-[#666]">사진 준비중</span>
          <span className="text-xs text-gray-400">조금만 기다려주세요!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${photoIndex * 100}%)` }}>
        {images.map((src) => (
          <img key={src} src={src} alt={name} loading="lazy" className="w-full h-full flex-none object-cover" />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={showPrevPhoto}
            aria-label="이전 사진"
            className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <IconChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={showNextPhoto}
            aria-label="다음 사진"
            className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
          <span className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/40 px-2 py-0.5 rounded-full">
            사진 {images.length}장 보기
          </span>
        </>
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, scrapIds, toggleScrap } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [backup, setBackup] = useState(null);
  const [nearbyDessert, setNearbyDessert] = useState(null);
  const [dessertChecked, setDessertChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDessertChecked(false);
    fetchRestaurantById(id)
      .then((data) => {
        if (cancelled) return;
        setRestaurant(data);
        if (!data) return;
        fetchBackupPlan(data).then((b) => !cancelled && setBackup(b));
        if (data.category !== "디저트") {
          fetchNearbyDessert(data).then((d) => {
            if (cancelled) return;
            setNearbyDessert(d);
            setDessertChecked(true);
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // restaurant가 바뀔 때(=페이지를 새로 불러올 때)만 다시 섞임 — 구글 리뷰가 항상 먼저, 네이버가
  // 항상 나중에 나오던 걸 매번 다른 순서로 보여주기 위함.
  const shuffledReviews = useMemo(() => shuffle(restaurant?.reviews ?? []), [restaurant]);

  if (loading) {
    return (
      <div className="min-h-full flex flex-col">
        <Header active="search" />
        <div className="p-10 text-center text-gray-400">불러오는 중이에요...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-full flex flex-col">
        <Header active="search" />
        <div className="p-10 text-center text-gray-400">맛집 정보를 찾을 수 없어요.</div>
      </div>
    );
  }

  const isSaved = scrapIds.includes(restaurant.id);

  function handleSaveClick() {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleScrap(restaurant.id);
  }

  // 모바일 전용 SNS 공유 — OS 네이티브 공유 시트(카카오톡/인스타그램 등)를 띄운다.
  // PC는 공유 시트가 없는 대신 별도 "주소 복사" 버튼(handleCopyLinkClick)을 쓴다.
  async function handleShareClick() {
    const shareData = { title: restaurant.name, text: restaurant.tagline, url: window.location.href };
    try {
      await navigator.share(shareData);
    } catch {
      // 사용자가 공유 시트를 취소한 경우 — 별도 처리 불필요
    }
  }

  async function handleCopyLinkClick() {
    await navigator.clipboard.writeText(window.location.href);
    alert("링크가 복사되었어요.");
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header active="search" />

      {/* 히어로 이미지 — Header와 동일하게 항상 화면 전체 폭(모바일 포함)으로 꽉 채움. */}
      <div className="relative w-full">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full aspect-[32/14] sm:aspect-[32/5] sm:max-h-[260px] object-cover [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "block";
            }}
          />
        ) : null}
        <img
          src="/defaultHero.png"
          alt=""
          className="w-full aspect-[32/14] sm:aspect-[32/5] sm:max-h-[260px] object-cover [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
          style={{ objectPosition: "center calc(50% - 200px)", ...(restaurant.image ? { display: "none" } : {}) }}
        />
        {restaurant.image && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 via-70% to-transparent pointer-events-none" />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-[#fff] font-bold text-2xl md:text-3xl text-center px-6">{restaurant.name}</h1>
        </div>
        <div className="absolute top-4 inset-x-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center bg-white/80 backdrop-blur text-gray-700 rounded-full w-8 h-8 md:w-10 md:h-10 shadow-md hover:text-brand-navy transition-colors cursor-pointer -translate-x-2 md:translate-x-0 md:translate-y-2"
          >
            <IconArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          {/* 모바일: OS 네이티브 공유 시트 / PC: 공유 시트가 없으므로 링크 복사 버튼으로 대체 */}
          <button
            onClick={handleShareClick}
            aria-label="공유하기"
            className="md:hidden inline-flex items-center justify-center bg-white/80 backdrop-blur text-gray-700 rounded-full w-8 h-8 shadow-md hover:text-brand-navy transition-colors cursor-pointer translate-x-2"
          >
            <IconShare className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLinkClick}
            aria-label="주소 복사"
            className="hidden md:inline-flex items-center justify-center bg-white/80 backdrop-blur text-gray-700 rounded-full md:w-10 md:h-10 shadow-md hover:text-brand-navy transition-colors cursor-pointer md:translate-y-2"
          >
            <IconLink className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col px-3 md:px-0">
        <div className="relative z-10 -mt-3 md:mx-6 bg-white rounded-t-3xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-4 md:p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-x-6">
            {/* 왼쪽: 사진+정보(flex row, items-stretch로 높이 동기화) 위, 리뷰 아래 — 지도(오른쪽 독립 블록)와는
                완전히 분리되어 있어, 리뷰가 아무리 길어져도 지도/저장버튼 라인에 영향을 주지 않는다. */}
            <div className="order-1 md:flex-[2] flex flex-col gap-6 min-w-0">
              <div className="flex flex-col md:flex-row md:items-stretch gap-6">
                {/* 사진 */}
                <div className="md:flex-1 min-w-0">
                  <PhotoCarousel
                    images={restaurant.images?.length ? restaurant.images : restaurant.image ? [restaurant.image] : []}
                    name={restaurant.name}
                  />
                </div>

                {/* 식당 정보 — 저장 버튼은 mt-auto로 사진 하단 라인에 맞춤(items-stretch가 이 컬럼을 사진과 같은 높이로 늘림) */}
                <div className="md:flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(restaurant.region)}`)}
                      className="text-xs font-medium text-status-open hover:underline cursor-pointer"
                    >
                      #{restaurant.region}
                    </button>
                    <button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(restaurant.category)}`)}
                      className="text-xs font-medium text-status-open hover:underline cursor-pointer"
                    >
                      #{restaurant.category}
                    </button>
                    {restaurant.localRatio >= 60 && <span className="text-xs font-medium text-status-open">#현지인방문다수</span>}
                    {!restaurant.hasRudeReview && <span className="text-xs font-medium text-status-open">#불친절후기없음</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-2xl leading-tight">{restaurant.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs text-brand-coral bg-brand-coral/10 px-2.5 py-1 rounded-full">
                        <IconStar className="w-3.5 h-3.5" />
                        {restaurant.rating} ({restaurant.reviewCount})
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-brand-navy bg-brand-navy/10 px-2.5 py-1 rounded-full">
                        현지인 방문 {restaurant.localRatio}%
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                          (STATUS_PILL[resolveStatusKey(restaurant)] ?? STATUS_PILL.open).className
                        }`}
                      >
                        {(STATUS_PILL[resolveStatusKey(restaurant)] ?? STATUS_PILL.open).label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="text-sm text-gray-600 inline-flex items-start gap-1.5">
                      <IconPin className="w-4 h-4 flex-none mt-0.5" />
                      {restaurant.address}
                    </div>
                    <div className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                      <IconPhone className="w-4 h-4 flex-none" />
                      {restaurant.phone}
                    </div>
                    {/* 핫페퍼 그루메 API 보강 데이터(2026-08-18) — 위경도 거리 매칭이라 전체 가게 중 약 80%만
                        채워져 있으므로 값이 있을 때만 조건부 렌더링. 영업시간·예산·정휴일은 Edge Function에서
                        Cloud Translation API로 이미 한글로 번역해 저장하므로 여기서 추가 가공하지 않음. */}
                    {restaurant.businessHours && (
                      <div className="text-sm text-gray-600 inline-flex items-start gap-1.5">
                        <IconClock className="w-4 h-4 flex-none mt-0.5" />
                        <span>
                          {restaurant.businessHours}
                          {restaurant.regularHoliday && restaurant.regularHoliday !== "없음" && (
                            <span className="text-gray-400"> · 정휴일 {restaurant.regularHoliday}</span>
                          )}
                        </span>
                      </div>
                    )}
                    {(restaurant.budgetDinner || restaurant.budgetLunch) && (
                      <div className="text-sm text-gray-600 inline-flex items-start gap-1.5">
                        <IconWallet className="w-4 h-4 flex-none mt-0.5" />
                        <span>
                          {restaurant.budgetDinner && <>디너 {restaurant.budgetDinner}</>}
                          {restaurant.budgetDinner && restaurant.budgetLunch && " · "}
                          {restaurant.budgetLunch && <>런치 {restaurant.budgetLunch}</>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={handleSaveClick}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-gradient-to-b from-brand-coral to-brand-coral-dark rounded-xl py-3.5 shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)] hover:brightness-105 transition-all cursor-pointer"
                    >
                      <IconStar className="w-4 h-4" />
                      {isSaved ? "저장됨" : "이 가게 저장하기"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 리뷰 본문 — 사진+정보 바로 아래, 사진 하단에서 20px */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5 mb-1">
                  <h3 className="text-base font-bold text-gray-900">리뷰</h3>
                  {/* 구글 리뷰 카드마다 반복되던 안내 문구를 이 헤더 라인 오른쪽에 한 번만 표시하도록 옮김 —
                      구글 리뷰(googlePlaceId 있음)가 있을 때만 의미가 있어 그 경우에만 렌더링 */}
                  {restaurant.googlePlaceId && (
                    <span className="text-[11px] text-gray-400 text-right relative top-1 -left-1">
                      클릭하면 구글맵 가게 페이지로 이동해요 —
                      <br className="md:hidden" /> 상단 '리뷰' 탭을 눌러 전체 리뷰를 확인하세요
                    </span>
                  )}
                </div>
                {shuffledReviews.length === 0 ? (
                  <div className="text-base text-gray-400 bg-brand-peach/30 rounded-xl p-4 text-center">아직 검증된 리뷰가 없어요.</div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pretty-scroll pb-1">
                    {shuffledReviews.map((rv, i) => (
                      <ReviewCard key={i} review={rv} googlePlaceId={restaurant.googlePlaceId} />
                    ))}
                  </div>
                )}
                <h4 className="text-right mr-2 text-[11px] tracking-wider text-gray-400 font-sans mt-2.5">
                  필터링된 검증 리뷰 · 출처: 네이버 블로그 + 구글
                  <br></br>Powered by Google · 리뷰 최대 5개
                </h4>
                <div className="text-right mr-2 text-[10px] text-gray-400"></div>
              </div>
            </div>

            {/* 오른쪽: 위치(지도) + 근처 백업 플랜/디저트 — 왼쪽 블록(사진+정보+리뷰)과 완전히 독립된 형제
                컬럼이라, 리뷰 길이와 무관하게 항상 자기 콘텐츠(지도+버튼들) 높이만큼만 차지한다. */}
            <aside className="order-2 md:flex-[0.85] flex flex-col gap-3 min-w-0 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">위치</h3>
                {restaurant.hotpepperUrl && (
                  <a
                    href={restaurant.hotpepperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-navy inline-flex items-center gap-1 hover:underline"
                  >
                    <IconExternalLink className="w-3.5 h-3.5 flex-none" />
                    핫페퍼 그루메에서 보기
                  </a>
                )}
              </div>

              <div className="w-full [container-type:inline-size]">
                <iframe
                  title={`${restaurant.name} 위치 지도`}
                  className="w-full rounded-2xl border-0"
                  style={{ height: "calc(75cqw - 38px)" }}
                  loading="lazy"
                  src={googleMapEmbedSrc(restaurant.lat, restaurant.lng)}
                />
              </div>

              <a
                href={
                  restaurant.googlePlaceId
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.googlePlaceId}`
                    : `https://www.google.com/maps/search/?api=1&query=${restaurant.lat}%2C${restaurant.lng}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-brand-navy border border-brand-navy rounded-xl py-3.5 md:py-4 hover:bg-brand-navy/5 transition-colors"
              >
                구글 지도
              </a>

              <div className="flex gap-3">
                {backup ? (
                  <button
                    onClick={() => navigate(`/place/${backup.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-brand-coral-dark bg-brand-peach/40 rounded-xl py-3.5 hover:bg-brand-peach/60 transition-colors"
                  >
                    <IconPin className="w-4 h-4" />
                    근처 백업 플랜
                  </button>
                ) : (
                  <div className="flex-1 inline-flex items-center justify-center text-sm text-gray-400 border border-gray-200 rounded-xl py-3.5">
                    대안 없음
                  </div>
                )}

                {restaurant.category !== "디저트" &&
                  (nearbyDessert ? (
                    <button
                      onClick={() => navigate(`/place/${nearbyDessert.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-brand-pink-dark bg-brand-pink/10 rounded-xl py-3.5 hover:bg-brand-pink/20 transition-colors"
                    >
                      <IconCake className="w-4 h-4" />
                      근처 디저트 맛집
                    </button>
                  ) : (
                    dessertChecked && (
                      <div className="flex-1 inline-flex items-center justify-center text-sm text-gray-400 border border-gray-200 rounded-xl py-3.5">
                        근처 디저트 없음
                      </div>
                    )
                  ))}
              </div>

              <div className="text-[11px] text-gray-500 bg-[#f8f8f8] rounded-xl p-3 leading-relaxed">
                <strong className="block text-gray-600 font-bold mb-1">표기 원칙</strong>
                현지인 비율·협찬 판정은 자동 추정 결과입니다. 영업 상태는 실시간 소스 확정 전까지 참고용으로 표기합니다. 백업 플랜은 거리상 가까운
                같은 메뉴의 가게로 추천됩니다.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
