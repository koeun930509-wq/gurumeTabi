import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import SearchResultGridCard from '../components/SearchResultGridCard'
import AccountActions from '../components/AccountActions'
import { IconSearch, IconStar } from '../components/icons'
import { mockRestaurants } from '../data/mockRestaurants'
import { useAuth } from '../context/AuthContext'

export default function SavedPlacesPage() {
  const { savedIds } = useAuth()
  const navigate = useNavigate()
  const saved = mockRestaurants.filter((r) => savedIds.includes(r.id))

  return (
    <div className="min-h-full flex">
      <Sidebar active="saved" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header active="saved" />
        </div>

        <div className="p-6 pb-0 md:p-8 md:pb-0 w-full flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between md:pr-2">
            <h1 className="font-bold text-2xl text-gray-900 flex items-baseline gap-[10px]">
              저장한 맛집
              <span className="font-normal text-sm text-white">
                총 <span className="text-brand-navy font-bold text-lg">{saved.length}</span>개
              </span>
            </h1>
            <div className="hidden md:flex items-center gap-6">
              <AccountActions />
            </div>
          </div>

          {saved.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
              <div className="w-16 h-16 rounded-full bg-brand-peach flex items-center justify-center">
                <IconStar className="w-7 h-7 text-brand-navy" />
              </div>
              <h2 className="font-bold text-lg text-gray-900">아직 저장한 맛집이 없어요</h2>
              <p className="text-sm text-gray-500">검증된 맛집을 검색하고 별표를 눌러 저장해 보세요.</p>
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-2 bg-brand-navy text-white font-bold text-sm rounded-full px-6 py-3 mt-1 hover:bg-brand-navy-dark transition-colors"
              >
                <IconSearch className="w-4 h-4" />
                맛집 검색하러 가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {saved.map((r) => (
                <SearchResultGridCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}

          <Footer className="text-center text-white pt-3 pb-4" />
        </div>
      </div>
    </div>
  )
}
