export default function ReviewCard({ review }) {
  const isNaver = review.source === 'naver'
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">
          {isNaver ? '🅽' : '🅖'} {review.author}
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
      <p className="text-xs text-gray-600 leading-relaxed">{review.snippet}</p>
    </div>
  )
}
