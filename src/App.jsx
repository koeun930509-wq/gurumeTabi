import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import SavedPlacesPage from './pages/SavedPlacesPage'
import MyPage from './pages/MyPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/place/:id" element={<RestaurantDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <SavedPlacesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mypage"
        element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
