import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

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
        <form onSubmit={handleSearch} className="w-full max-w-2xl flex gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="지역 · 음식 종류로 검색 (예: 오사카 라멘)"
            className="flex-1 text-left text-base border border-gray-300 rounded-xl px-6 py-5 outline-none focus:border-brand-navy"
          />
          <button
            type="submit"
            className="bg-brand-coral text-white font-bold text-base rounded-xl px-8 py-5 whitespace-nowrap"
          >
            검색
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
      <section className="flex-none flex gap-3.5 overflow-x-auto px-6 py-5 border-t border-dashed border-gray-200 border-l-4 border-l-gray-400">
        {RECENT.map((r) => (
          <div
            key={r.label}
            className="flex-none w-36 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-500"
          >
            <div className="font-bold text-[13px] text-gray-900 mb-1">{r.label}</div>
            {r.time}
          </div>
        ))}
      </section>
    </div>
  )
}
