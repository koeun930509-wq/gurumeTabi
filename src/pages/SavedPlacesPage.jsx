import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import RestaurantCard from '../components/RestaurantCard'
import { IconStar } from '../components/icons'
import { mockRestaurants } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

export default function SavedPlacesPage() {
  const { savedIds } = useAuth()
  const saved = mockRestaurants.filter((r) => savedIds.includes(r.id))

  return (
    <div className="min-h-full flex">
      <Sidebar active="saved" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header active="saved" />
        </div>

        <div className="p-6 w-full flex-1 flex flex-col gap-6">
          <h1 className="font-bold text-2xl text-gray-900">저장한 맛집</h1>

          {saved.length === 0 ? (
            <div className="flex-1 text-base text-gray-400 bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-8 text-center flex items-center justify-center gap-1.5 w-full">
              아직 저장한 맛집이 없어요. 맛집 상세에서
              <IconStar className="w-4 h-4 flex-none text-yellow-500" />
              눌러 저장해보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {saved.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
