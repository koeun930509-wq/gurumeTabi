import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import LoginPage from './pages/LoginPage'
import SavedPlacesPage from './pages/SavedPlacesPage'
import MyPage from './pages/MyPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/place/:id" element={<RestaurantDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* 뼈대 단계 — 로그인 없이도 접근 가능하게 열어둠 */}
      <Route path="/saved" element={<SavedPlacesPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  )
}

export default App
