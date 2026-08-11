import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { IconSearch } from '../components/icons'

const POPULAR = ['오사카', '도쿄', '돈카츠', '라멘', '이자카야', '스시']
const RECENT = [
  { label: '오사카 라멘', time: '어제 검색' },
  { label: '교토 카이세키', time: '3일 전' },
  { label: '후쿠오카 야키토리', time: '지난주' },
]

export default function HomePage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 1. header — 상단 고정 */}
      <Header active="home" showSearch={false} />

      {/* 3. header/이전 서치 결과를 뺀 나머지 공간에 검색 폼을 정중앙 배치 */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-0">
        <div className="text-xs font-mono tracking-widest text-gray-400 mb-4">
          광고 없는 찐맛집 · 일본 여행 전용
        </div>
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="지역 · 음식 종류로 검색 (예: 오사카 라멘)"
            className="w-full text-left text-base bg-white rounded-full pl-6 pr-16 py-5 outline-none shadow-[0_10px_30px_-10px_rgba(109,40,217,0.3)] focus:shadow-[0_10px_30px_-6px_rgba(109,40,217,0.45)] transition-shadow"
          />
          <button
            type="submit"
            aria-label="검색"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-brand-coral to-brand-coral-dark hover:bg-gradient-to-br hover:from-brand-navy hover:to-brand-navy-dark text-white rounded-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.55)] hover:shadow-[0_8px_20px_-4px_rgba(76,29,149,0.7)] hover:scale-105 transition-all"
          >
            <IconSearch className="w-5 h-5" />
          </button>
        </form>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-5">
          {POPULAR.map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="text-sm text-status-open font-medium hover:underline"
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* 2. 이전 서치 결과 — 하단 고정 */}
      <section className="flex-none flex gap-3.5 overflow-x-auto px-6 py-5">
        {RECENT.map((r) => (
          <div
            key={r.label}
            className="flex-none min-w-[200px] bg-white rounded-xl p-5 text-sm text-gray-500 whitespace-nowrap"
          >
            <div className="font-bold text-base text-gray-900 mb-1">{r.label}</div>
            {r.time}
          </div>
        ))}
      </section>
    </div>
  )
}
