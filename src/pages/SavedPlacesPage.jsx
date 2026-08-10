import Header from '../components/Header'
import RestaurantCard from '../components/RestaurantCard'
import { mockRestaurants } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

export default function SavedPlacesPage() {
  const { savedIds } = useAuth()
  const saved = mockRestaurants.filter((r) => savedIds.includes(r.id))

  return (
    <div className="min-h-full flex flex-col">
      <Header active="saved" />

      <div className="p-6 max-w-5xl mx-auto w-full">
        {saved.length === 0 ? (
          <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md p-8 text-center">
            아직 저장한 맛집이 없어요. 맛집 상세에서 ⭐ 눌러 저장해보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {saved.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
