import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import ReviewCard from '../components/ReviewCard'
import { IconArrowLeft, IconPhone, IconPin, IconStar } from '../components/icons'
import { getBackupPlan, getRestaurantById } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

function osmEmbedSrc(lat, lng, delta = 0.006) {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

const STATUS_PILL = {
  open: { label: '영업중', className: 'text-status-open bg-status-open/10' },
  closed: { label: '휴무', className: 'text-status-closed bg-status-closed/10' },
  soldout: { label: '재료소진', className: 'text-status-soldout bg-status-soldout/10' },
}

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, savedIds, toggleSave } = useAuth()
  const restaurant = getRestaurantById(id)

  if (!restaurant) {
    return (
      <div className="min-h-full flex flex-col">
        <Header active="search" />
        <div className="p-10 text-center text-gray-400">맛집 정보를 찾을 수 없어요.</div>
      </div>
    )
  }

  const isSaved = savedIds.includes(restaurant.id)
  const backup = getBackupPlan(restaurant.id)

  function handleSaveClick() {
    if (!user) {
      navigate('/login')
      return
    }
    toggleSave(restaurant.id)
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header active="search" />

      {/* 히어로 이미지 */}
      <div className="relative w-full">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full aspect-[32/7] sm:aspect-[32/5] object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'block'
            }}
          />
        ) : null}
        <div
          className="w-full aspect-[32/7] sm:aspect-[32/5] bg-[repeating-linear-gradient(45deg,#FFE4D3_0,#FFE4D3_5px,#FFF3EA_5px,#FFF3EA_10px)]"
          style={restaurant.image ? { display: 'none' } : undefined}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-6 inline-flex items-center gap-1.5 bg-white/80 backdrop-blur text-xs font-bold text-gray-700 rounded-full px-4 py-2 shadow-md hover:text-brand-navy transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          검색결과
        </button>
      </div>

      <div className="relative z-10 -mt-3 mx-6 bg-white rounded-t-3xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-6 flex flex-col gap-5">
        {/* 제목 영역 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-2xl">{restaurant.name}</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-status-open bg-status-open/10 px-2.5 py-1 rounded-full">
            <IconStar className="w-3.5 h-3.5" />
            {restaurant.rating}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full ${
              (STATUS_PILL[restaurant.status] ?? STATUS_PILL.open).className
            }`}
          >
            {(STATUS_PILL[restaurant.status] ?? STATUS_PILL.open).label}
          </span>
          <span className="text-base text-gray-400">
            {restaurant.category} · 리뷰 {restaurant.reviewCount}개
          </span>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-4 gap-6">
          {/* 사이드바: 모바일에서는 리뷰보다 먼저, 데스크톱에서는 오른쪽 */}
          <aside className="order-1 md:order-2 md:col-span-1 flex flex-col gap-3 h-fit">
            <div className="flex flex-col gap-2.5">
              <h4 className="text-[11px] tracking-wider text-gray-400 font-bold">가게 정보</h4>
              <div className="text-sm text-gray-600 inline-flex items-start gap-1.5">
                <IconPin className="w-4 h-4 flex-none mt-0.5" />
                {restaurant.address}
              </div>
              <div className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                <IconPhone className="w-4 h-4 flex-none" />
                {restaurant.phone}
              </div>
            </div>

            <iframe
              title={`${restaurant.name} 위치 지도`}
              className="aspect-[4/3] w-full rounded-2xl border-0"
              loading="lazy"
              src={osmEmbedSrc(restaurant.lat, restaurant.lng)}
            />

            <button
              onClick={handleSaveClick}
              className="w-full inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-gradient-to-b from-brand-coral to-brand-coral-dark rounded-xl py-3.5 shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)] hover:brightness-105 transition-all"
            >
              <IconStar className="w-4 h-4" />
              {isSaved ? '저장됨' : '이 가게 저장하기'}
            </button>

            {backup ? (
              <button
                onClick={() => navigate(`/place/${backup.id}`)}
                className="w-full inline-flex items-center justify-center gap-2 text-base font-bold text-brand-coral-dark bg-brand-peach/60 hover:bg-brand-peach rounded-xl py-3.5 transition-colors"
              >
                근처 백업 플랜 보기 →
              </button>
            ) : (
              <div className="text-sm text-gray-400 text-center py-1">근처에 대안이 없어요.</div>
            )}

            <div className="text-[11px] text-gray-500 bg-[#f8f8f8] rounded-xl p-3 leading-relaxed">
              <strong className="block text-gray-600 font-bold mb-1">표기 원칙</strong>
              현지인 비율·협찬 판정은 자동 추정 결과입니다. 영업 상태는 실시간 소스 확정 전까지 참고용으로 표기합니다.
            </div>
          </aside>

          {/* 리뷰 본문 */}
          <div className="order-2 md:order-1 md:col-span-3 flex flex-col gap-3">
            <div>
              <div className="flex flex-wrap gap-2.5 mb-2.5">
                {restaurant.localRatio >= 60 && (
                  <span className="text-xs font-medium text-status-open">#현지인 방문 다수</span>
                )}
                {!restaurant.hasRudeReview && (
                  <span className="text-xs font-medium text-status-open">#불친절 후기 없음</span>
                )}
              </div>
              {restaurant.reviews.length === 0 ? (
                <div className="text-base text-gray-400 bg-brand-peach/30 rounded-xl p-4 text-center">
                  아직 검증된 리뷰가 없어요.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pretty-scroll pr-1">
                  {restaurant.reviews.map((rv, i) => (
                    <ReviewCard key={i} review={rv} />
                  ))}
                </div>
              )}
              <h4 className="text-right text-[11px] tracking-wider text-gray-400 font-sans mt-2.5 mb-1">
                필터링된 검증 리뷰 · 출처: 네이버 블로그 + 구글
              </h4>
              <div className="text-right text-[10px] text-gray-400">
                Powered by Google · 리뷰 최대 5개
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
