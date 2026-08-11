export default function ReviewCard({ review }) {
  const isNaver = review.source === 'naver'
  return (
    <div className="rounded-xl p-3 bg-white border border-brand-peach-dark flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold inline-flex items-center gap-1.5">
          <span
            className={`w-4 h-4 rounded-full flex-none flex items-center justify-center text-[9px] font-extrabold text-white ${
              isNaver ? 'bg-status-open' : 'bg-brand-navy'
            }`}
          >
            {isNaver ? 'N' : 'G'}
          </span>
          {review.author}
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
    </div>
  )
}
