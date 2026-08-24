// 일본 본토+오키나와를 넉넉히 감싸는 사각 범위. "내 근처 맛집"은 일본에서만 의미가 있는 기능이라,
// 정확한 국경선 대신 이 정도의 러프한 bounding box로 충분하다(오탐이 나도 "일본 밖" 방향으로만 안전).
const JAPAN_BOUNDS = { minLat: 24, maxLat: 46, minLng: 122, maxLng: 146 }

export function isInJapan(lat, lng) {
  return (
    lat >= JAPAN_BOUNDS.minLat &&
    lat <= JAPAN_BOUNDS.maxLat &&
    lng >= JAPAN_BOUNDS.minLng &&
    lng <= JAPAN_BOUNDS.maxLng
  )
}
