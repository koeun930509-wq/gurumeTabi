import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function RestaurantCard({ restaurant }) {
  return (
    <Link
      to={`/place/${restaurant.id}`}
      className="block border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="h-24 bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_4px,transparent_4px,transparent_8px)]" />
      <div className="p-3 flex flex-col gap-1.5">
        <div className="font-bold text-sm truncate">{restaurant.name}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-status-open bg-status-open/10 px-2 py-0.5 rounded-full">
            ★{restaurant.rating}
          </span>
          {restaurant.hasRudeReview ? (
            <span className="text-xs font-bold text-brand-coral-dark bg-brand-coral/10 px-2 py-0.5 rounded-full">
              불친절 후기 有
            </span>
          ) : (
            <span className="text-xs font-bold text-status-open bg-status-open/10 px-2 py-0.5 rounded-full">
              현지인 {restaurant.localRatio}%
            </span>
          )}
          <StatusBadge status={restaurant.status} />
        </div>
      </div>
    </Link>
  )
}
