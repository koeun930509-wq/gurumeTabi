import { useLayoutEffect, useRef, useState } from 'react'
import { maskReviewAuthor } from '../utils/maskReviewAuthor'

const ELLIPSIS_SUFFIX = '...'

const graphemeSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null

// 문자열을 그래핌(👍 같은 서로게이트 페어 이모지도 한 덩어리) 단위로 쪼갠다 — 일반 slice(index)는 코드
// 유닛 단위라 이모지 중간을 잘라 깨진 문자(�)를 만들 수 있어서, 잘라도 안전한 경계만 골라 쓰기 위함.
function toGraphemes(text) {
  if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
  return Array.from(text)
}

export default function ReviewCard({ review, googlePlaceId }) {
  const isNaver = review.source === 'naver'
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const [truncatedLength, setTruncatedLength] = useState(null)
  const snippetRef = useRef(null)
  const measureRef = useRef(null)

  // 줄 수 제한(모바일 5줄/PC 3줄)을 넘는 리뷰만 "...더보기"를 마지막 줄 텍스트 끝에 인라인으로 붙인다.
  // line-clamp만으로는 브라우저가 잘라내는 지점에 커스텀 마크업을 끼워넣을 수 없어서(예: float 버튼은
  // -webkit-line-clamp 계산에서 무시되어 아예 렌더링 안 되는 버그가 있었음), 화면에 안 보이는 측정용
  // <p ref={measureRef}>에 전체 텍스트를 렌더링해 실제 clamp 높이(clientHeight)를 구하고, 그 높이를
  // 넘지 않는 최대 글자 수를 이진탐색으로 찾아 "텍스트 일부 + …더보기"를 실제 문자열로 잘라 붙인다.
  useLayoutEffect(() => {
    const el = snippetRef.current
    const measureEl = measureRef.current
    if (!el || !measureEl) return

    function recalc() {
      const wasClamped = el.scrollHeight - el.clientHeight > 1
      setIsClamped(wasClamped)
      if (!wasClamped) {
        setTruncatedLength(null)
        return
      }
      const maxHeight = el.clientHeight
      const graphemes = toGraphemes(review.snippet)
      // "더보기" 버튼(작은 폰트) 몫까지 같이 측정해야 실제 렌더링과 동일한 지점에서 줄바꿈 여부가 판정된다 —
      // 버튼 텍스트를 안 넣고 재면 잘린 본문만 3줄에 딱 맞고 그 뒤에 붙는 버튼이 4번째 줄로 밀려나는 버그가 남.
      function fits(count) {
        measureEl.innerHTML = ''
        measureEl.append(graphemes.slice(0, count).join('') + ELLIPSIS_SUFFIX + ' ')
        const btn = document.createElement('span')
        btn.className = 'text-xs font-bold'
        btn.textContent = '더보기'
        measureEl.append(btn)
        return measureEl.scrollHeight <= maxHeight
      }
      let lo = 0
      let hi = graphemes.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2)
        if (fits(mid)) {
          lo = mid
        } else {
          hi = mid - 1
        }
      }
      setTruncatedLength(lo)
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [review.snippet])
  // 구글 리뷰는 개별 리뷰 고유 링크를 API가 제공하지 않고, 리뷰 탭 직행에 필요한 CID도 Places API 응답에 없어서
  // place_id 기반 링크로는 가게 개요 페이지까지만 갈 수 있음(리뷰 탭 자동 전환 불가) — 그래서 카드 안내 문구로 보완함.
  const googleReviewsUrl = googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}&query_place_id=${googlePlaceId}`
    : null
  const isClickable = !isNaver && Boolean(googleReviewsUrl)

  const Wrapper = isClickable ? 'a' : 'div'
  const wrapperProps = isClickable
    ? { href: googleReviewsUrl, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`relative rounded-xl p-3 bg-white border border-[#ddd] flex flex-col gap-1.5 transition-colors ${
        isClickable ? 'cursor-pointer' : ''
      } ${
        isNaver ? 'hover:border-status-open hover:bg-status-open/10' : 'hover:border-brand-navy hover:bg-brand-navy/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold inline-flex items-center gap-1.5">
          <span
            className={`w-4 h-4 rounded-full flex-none flex items-center justify-center text-[9px] font-extrabold text-white ${
              isNaver ? 'bg-status-open' : 'bg-brand-navy'
            }`}
          >
            {isNaver ? 'N' : 'G'}
          </span>
          {maskReviewAuthor(review.author)}
        </span>
        {isNaver ? (
          <span className="text-[10px] font-bold text-status-open bg-status-open/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            협찬 아님 ✓
          </span>
        ) : (
          <span className="text-[10px] font-bold text-status-open bg-status-open/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            ★{review.rating}
          </span>
        )}
      </div>
      {/* clamp 여부·높이 측정 전용 — 실제 카드 폭과 동일하게 겹쳐 두되 visibility:hidden으로 화면엔 안 보이게 함
          (display:none을 쓰면 scrollHeight/clientHeight가 0이 되어 측정이 불가능해서 이 방식을 씀) */}
      <p
        ref={snippetRef}
        aria-hidden="true"
        className="text-base leading-relaxed line-clamp-5 md:line-clamp-3 invisible absolute left-3 right-3 -z-10 pointer-events-none"
      >
        {review.snippet}
      </p>
      {/* right-12로 snippetRef보다 오른쪽 여백을 더 둬서, "더보기"가 마지막 줄 우측 끝에 딱 붙지 않고
          몇 단어 정도 안쪽(왼쪽)에서 잘리도록 함 — 스크린샷 피드백: 버튼이 너무 오른쪽 끝에 붙어 눈에 안 띔 */}
      <p
        ref={measureRef}
        aria-hidden="true"
        className="text-base leading-relaxed invisible absolute left-3 right-12 -z-10 pointer-events-none"
      />
      {!isClamped && <p className="text-base text-gray-600 leading-relaxed">{review.snippet}</p>}
      {isClamped && !expanded && truncatedLength !== null && (
        <p className="text-base text-gray-600 leading-relaxed">
          {toGraphemes(review.snippet).slice(0, truncatedLength).join('')}
          {ELLIPSIS_SUFFIX}{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded(true)
            }}
            className="text-xs font-bold text-[#666] whitespace-nowrap cursor-pointer hover:underline"
          >
            더보기
          </button>
        </p>
      )}
      {isClamped && expanded && (
        <p className="text-base text-gray-600 leading-relaxed">
          {review.snippet}{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded(false)
            }}
            className="text-xs font-bold text-[#666] whitespace-nowrap cursor-pointer hover:underline"
          >
            접기
          </button>
        </p>
      )}
      {isClickable && (
        <p className="text-[11px] text-gray-400">
          클릭하면 구글맵 가게 페이지로 이동해요 — 상단 '리뷰' 탭을 눌러 전체 리뷰를 확인하세요
        </p>
      )}
    </Wrapper>
  )
}
