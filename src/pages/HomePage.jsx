import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchAutocompleteInput from '../components/SearchAutocompleteInput'
import { IconSearch, IconClose, IconArrowLeft } from '../components/icons'
import { useAuth } from '../context/AuthContext'

const POPULAR = ['오사카', '도쿄', '돈카츠', '라멘', '이자카야', '스시', '우동', '오코노미야키']
const RECENT = []

function formatSearchedAt(iso) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd}.`
}

export default function HomePage() {
  const [q, setQ] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { recentSearches, addRecentSearch, removeRecentSearch } = useAuth()

  function runSearch(keyword) {
    addRecentSearch(keyword)
    navigate(keyword ? `/search?q=${encodeURIComponent(keyword)}` : '/search')
  }

  function handleSearch(e) {
    e.preventDefault()
    runSearch(q)
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      {/* 배경 영상 + 어두운 오버레이 */}
      <video
        className="absolute inset-0 w-full h-full object-cover -z-20"
        src="/sushi.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-brand-navy-dark/35 -z-10" aria-hidden="true" />

      {/* header — 상단 고정 */}
      <Header active="home" showSearch={false} />

      {/* 헤드라인 → 검색창 → 인기 태그 순으로 정중앙 배치 */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-0 gap-5">
        <div className="flex flex-col items-center gap-5 w-full -mt-[60px]">
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-jua text-5xl sm:text-5xl md:text-6xl text-white leading-tight">
              광고 없는 <span className="text-brand-coral">찐맛집,</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white">
              일본 미식여행을 위한 맛집 검색
            </p>
          </div>

          <form onSubmit={handleSearch} className="gradient-border-input relative w-full max-w-2xl">
            <SearchAutocompleteInput
              value={q}
              onChange={setQ}
              onSubmit={runSearch}
              onFocus={() => setMobileSearchOpen(true)}
              placeholder="지역 · 음식 종류로 검색 (예: 오사카 라멘)"
              inputClassName="w-full text-left text-base bg-white rounded-full pl-6 pr-28 py-5 outline-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] focus:shadow-[0_10px_30px_-6px_rgba(0,0,0,0.6)] transition-shadow"
              wrapperClassName="relative w-full"
              listClassName="absolute left-0 right-0 top-full mt-2 bg-white/90 rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-30 overflow-hidden text-left md:block hidden"
            />
            {q && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQ('')}
                className="absolute right-[70px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              aria-label="검색"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[52px] h-[52px] flex items-center justify-center bg-gradient-to-br from-brand-coral to-brand-coral-dark hover:bg-gradient-to-br hover:from-brand-navy hover:to-brand-navy-dark text-white rounded-full shadow-[0_6px_16px_-4px_rgba(126,34,206,0.55)] hover:shadow-[0_8px_20px_-4px_rgba(76,29,149,0.7)] hover:scale-105 transition-all cursor-pointer"
            >
              <IconSearch className="w-6 h-6" />
            </button>
          </form>
        </div>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 leading-none sm:leading-normal">
          {POPULAR.map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="text-sm text-white hover:underline"
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* 이전 서치 결과 — 하단 고정, 검색 기록이 없으면 아무것도 표시하지 않음 */}
      {RECENT.length > 0 && (
        <section className="relative flex-none flex gap-3.5 overflow-x-auto px-6 py-5">
          {RECENT.map((r) => (
            <button
              key={r.label}
              onClick={() => navigate(`/search?q=${encodeURIComponent(r.label)}`)}
              className="group flex-none min-w-[200px] text-left cursor-pointer bg-white/60 hover:bg-brand-navy/70 rounded-xl p-5 text-sm text-gray-500 hover:text-white whitespace-nowrap hover:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-200 ease-out"
            >
              <div className="font-bold text-base text-gray-900 group-hover:text-white mb-1">{r.label}</div>
              {r.time}
            </button>
          ))}
          {/* 인기 검색어 fallback — 나중에 다시 켤 수 있도록 주석으로만 보존
          {POPULAR.map((tag, i) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="group flex-1 text-left cursor-pointer bg-white/60 hover:bg-brand-navy/70 rounded-xl p-5 text-sm text-gray-500 hover:text-white whitespace-nowrap hover:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-200 ease-out"
            >
              <div className="font-bold text-base text-gray-900 group-hover:text-white mb-1">#{tag}</div>
              인기검색어{i + 1}
            </button>
          ))}
          */}
        </section>
      )}

      <Footer className="relative flex-none text-center text-white/70 pt-3 pb-1 -translate-y-4" />

      {/* 모바일 전용 — 검색창 탭 시 전체화면으로 최근 검색어 목록을 보여줌(PC는 인풋 하단 드롭다운 자동완성만 씀) */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              runSearch(q)
              setMobileSearchOpen(false)
            }}
            className="flex-none flex items-center gap-2 px-3 py-3 border-b border-gray-100"
          >
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setMobileSearchOpen(false)}
              className="flex-none w-9 h-9 flex items-center justify-center text-gray-600 cursor-pointer"
            >
              <IconArrowLeft className="w-5 h-5" />
            </button>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 text-lg outline-none placeholder:text-gray-300"
            />
            <button type="submit" aria-label="검색" className="flex-none w-9 h-9 flex items-center justify-center text-gray-700 cursor-pointer">
              <IconSearch className="w-5 h-5" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto">
            {recentSearches.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-16">최근 검색 기록이 없어요.</div>
            ) : (
              recentSearches.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setQ(r.keyword)
                    runSearch(r.keyword)
                    setMobileSearchOpen(false)
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-50 text-left cursor-pointer hover:bg-gray-50"
                >
                  <span className="text-base text-gray-800 truncate">{r.keyword}</span>
                  <span className="flex-none flex items-center gap-3">
                    <span className="text-sm text-gray-400">{formatSearchedAt(r.searched_at)}</span>
                    <span
                      role="button"
                      aria-label="검색 기록 삭제"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecentSearch(r.id)
                      }}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <IconClose className="w-4 h-4" />
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
