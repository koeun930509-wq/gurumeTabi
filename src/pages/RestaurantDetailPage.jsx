import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import ReviewCard from '../components/ReviewCard'
import { getBackupPlan, getRestaurantById } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

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
  const needsBackup = restaurant.status !== 'open'
  const backup = needsBackup ? getBackupPlan(restaurant.id) : null

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

      <div className="max-w-4xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-3.5">
          <div className="h-48 rounded-lg bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_5px,transparent_5px,transparent_10px)]" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-lg">{restaurant.name}</span>
            <span className="text-xs text-gray-400">구글 평점 ★{restaurant.rating} (3.5+ 기준 충족)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={restaurant.status} />
            <button
              onClick={handleSaveClick}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isSaved
                  ? 'bg-brand-coral text-white border-brand-coral'
                  : 'bg-status-open/10 text-status-open border-status-open'
              }`}
            >
              ⭐ {isSaved ? '저장됨' : '저장'}
            </button>
          </div>
          <div className="text-xs text-gray-500 flex flex-col gap-0.5">
            <div>📍 {restaurant.address}</div>
            <div>📞 {restaurant.phone}</div>
          </div>

          <div>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2">
              필터링된 검증 리뷰 · 출처: 네이버 블로그 + 구글
            </h4>
            {restaurant.reviews.length === 0 ? (
              <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-md p-4 text-center">
                아직 검증된 리뷰가 없어요.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
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

        {needsBackup && (
          <aside className="bg-gray-50 rounded-lg p-5 flex flex-col gap-3 h-fit">
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono">근처 백업 플랜</h4>
            <div className="h-32 rounded-md bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[length:14px_14px] bg-gray-100 flex items-center justify-center text-lg">
              📍
            </div>
            {backup ? (
              <>
                <div className="text-sm font-bold">{backup.name}</div>
                <div className="text-xs text-gray-500">★{backup.rating} · 도보 {backup.walkMinutes}분</div>
                <button
                  onClick={() => navigate(`/place/${backup.id}`)}
                  className="bg-brand-coral text-white font-bold text-xs rounded-md py-2 text-center"
                >
                  근처 백업 플랜 보기 →
                </button>
              </>
            ) : (
              <div className="text-xs text-gray-400">근처에 대안이 없어요.</div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
