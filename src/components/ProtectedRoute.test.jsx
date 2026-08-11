import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

function renderWithAuth(user) {
  return render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter initialEntries={['/mypage']}>
        <Routes>
          <Route path="/login" element={<div>로그인 화면</div>} />
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <div>마이페이지 내용</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  it('로그인하지 않은 경우 로그인 화면으로 리다이렉트한다', () => {
    renderWithAuth(null)
    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
  })

  it('로그인한 경우 보호된 화면을 그대로 보여준다', () => {
    renderWithAuth({ email: 'test@example.com' })
    expect(screen.getByText('마이페이지 내용')).toBeInTheDocument()
  })
})
