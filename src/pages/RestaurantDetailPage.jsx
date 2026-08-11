import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import ReviewCard from '../components/ReviewCard'
import { IconPhone, IconPin, IconStar } from '../components/icons'
import { getBackupPlan, getRestaurantById } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

function osmEmbedSrc(lat, lng, delta = 0.006) {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, savedIds, toggleSave } = useAuth()
  const restaurant = getRestaurantById(id)
  const mainMapRef = useRef(null)
  const [mainMapHeight, setMainMapHeight] = useState(null)

  useEffect(() => {
    const el = mainMapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setMainMapHeight(entries[0].contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

      <div className="w-full p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="aspect-[4/3] w-full rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling.style.display = 'block'
                }}
              />
            ) : null}
            <div
              className="aspect-[4/3] rounded-xl bg-[repeating-linear-gradient(45deg,#FFE4D3_0,#FFE4D3_5px,#FFF3EA_5px,#FFF3EA_10px)]"
              style={restaurant.image ? { display: 'none' } : undefined}
            />
            <iframe
              ref={mainMapRef}
              title={`${restaurant.name} 위치 지도`}
              className="aspect-[4/3] w-full rounded-xl border-0"
              loading="lazy"
              src={osmEmbedSrc(restaurant.lat, restaurant.lng)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-lg">{restaurant.name}</span>
            <span className="text-xs text-gray-400">구글 평점 ★{restaurant.rating} (3.5+ 기준 충족)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={restaurant.status} />
            <button
              onClick={handleSaveClick}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isSaved
                  ? 'bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white shadow-[0_4px_10px_-2px_rgba(126,34,206,0.5)]'
                  : 'bg-status-open/10 text-status-open'
              }`}
            >
              <IconStar className="w-3 h-3" />
              {isSaved ? '저장됨' : '저장'}
            </button>
          </div>
          <div className="text-base text-gray-500 flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5">
              <IconPin className="w-4 h-4 flex-none" />
              {restaurant.address}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <IconPhone className="w-4 h-4 flex-none" />
              {restaurant.phone}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2">
              필터링된 검증 리뷰 · 출처: 네이버 블로그 + 구글
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {restaurant.localRatio >= 60 && (
                <span className="text-xs font-bold text-status-open bg-status-open/10 px-2.5 py-1 rounded-full">
                  현지인 방문 다수
                </span>
              )}
              {!restaurant.hasRudeReview && (
                <span className="text-xs font-bold text-status-open bg-status-open/10 px-2.5 py-1 rounded-full">
                  불친절 후기 없음
                </span>
              )}
            </div>
            {restaurant.reviews.length === 0 ? (
              <div className="text-base text-gray-400 bg-brand-peach/30 rounded-xl p-4 text-center">
                아직 검증된 리뷰가 없어요.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {restaurant.reviews.map((rv, i) => (
                  <ReviewCard key={i} review={rv} />
                ))}
              </div>
            )}
            <div className="text-right text-[10px] text-gray-400 mt-1.5">
              Powered by Google · 리뷰 최대 5개
            </div>
          </div>
        </div>

        <aside className="pt-0 px-5 pb-5 flex flex-col gap-3 h-fit">
          <h4 className="text-lg font-bold">근처 백업 플랜</h4>
          <iframe
            title="근처 백업 플랜 지도"
            className={`w-full rounded-xl border-0 ${mainMapHeight ? '' : 'aspect-[4/3]'}`}
            style={mainMapHeight ? { height: `${mainMapHeight}px` } : undefined}
            loading="lazy"
            src={osmEmbedSrc((backup ?? restaurant).lat, (backup ?? restaurant).lng)}
          />
          {backup ? (
            <>
              <div className="text-base font-bold">{backup.name}</div>
              <div className="text-base text-gray-500">★{backup.rating} · 역에서 도보 {backup.walkMinutes}분</div>
              <button
                onClick={() => navigate(`/place/${backup.id}`)}
                className="bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white font-bold text-base rounded-full py-4 text-center shadow-[0_6px_16px_-4px_rgba(126,34,206,0.5)]"
              >
                근처 백업 플랜 보기 →
              </button>
            </>
          ) : (
            <div className="text-base text-gray-400">근처에 대안이 없어요.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
