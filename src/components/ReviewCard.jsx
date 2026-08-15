import { maskReviewAuthor } from '../utils/maskReviewAuthor'

export default function ReviewCard({ review, googlePlaceId }) {
  const isNaver = review.source === 'naver'
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
      className={`rounded-xl p-3 bg-white border border-[#ddd] flex flex-col gap-1.5 transition-colors ${
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
      <p className="text-base text-gray-600 leading-relaxed">{review.snippet}</p>
      {isClickable && (
        <p className="text-[11px] text-gray-400">
          클릭하면 구글맵 가게 페이지로 이동해요 — 상단 '리뷰' 탭을 눌러 전체 리뷰를 확인하세요
        </p>
      )}
    </Wrapper>
  )
}
