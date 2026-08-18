import { supabase } from './supabaseClient'

// restaurants 테이블(snake_case) → 프론트 컴포넌트가 기대하는 mock 데이터 shape(camelCase)로 변환.
// localRatio/hasRudeReview/acceptsCard/walkMinutes/acceptsReservation은 Google Places로 채울 수 없는 필드라
// DB에는 null로 들어있고, 여기서 필터가 자연스럽게 통과되도록 기본값을 준다.
function toViewModel(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image_url,
    images: row.image_urls?.length ? row.image_urls : row.image_url ? [row.image_url] : [],
    address: row.address,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    googlePlaceId: row.google_place_id,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    tagline: row.tagline ?? '',
    localRatio: row.local_ratio ?? 0,
    hasRudeReview: row.has_rude_review ?? false,
    status: row.status ?? 'open',
    acceptsCard: row.accepts_card ?? false,
    walkMinutes: row.walk_minutes ?? null,
    nearestStation: row.nearest_station ?? null,
    acceptsReservation: row.accepts_reservation ?? false,
    reviews: (row.reviews_cache ?? []).map((rv) => ({
      source: rv.source,
      author: rv.author,
      rating: rv.rating,
      snippet: rv.snippet,
      tasteSnippet: rv.taste_snippet,
      link: rv.link,
      isAdFiltered: rv.is_ad_filtered,
    })),
  }
}

export async function fetchRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*')
  if (error) throw error
  return data.map(toViewModel)
}

export async function fetchRestaurantById(id) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, reviews_cache(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? toViewModel(data) : null
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// "백업 플랜" — 원래 가게와 같은 지역·같은 음식종류인 영업중 가게 중 실제 거리(위경도 기준)가 가장 가까운 곳을 추천한다.
export async function fetchBackupPlan(restaurant) {
  const { id, region, category, lat, lng } = restaurant
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .neq('id', id)
    .eq('status', 'open')
    .eq('region', region)
    .eq('category', category)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  if (error) throw error
  if (!data || data.length === 0) return null

  const nearest = data
    .map((row) => ({ row, distance: haversineMeters(lat, lng, row.lat, row.lng) }))
    .sort((a, b) => a.distance - b.distance)[0]
  return nearest ? toViewModel(nearest.row) : null
}

// "근처 디저트 맛집" — 백업 플랜과 같은 방식이지만 음식종류 조건 없이 같은 지역의 '디저트' 카테고리 가게 중
// 실제 거리(위경도 기준)가 가장 가까운 곳을 추천한다. 식사 후 들를 디저트 가게를 찾는 용도라 카테고리는 고정.
export async function fetchNearbyDessert(restaurant) {
  const { id, region, lat, lng } = restaurant
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .neq('id', id)
    .eq('status', 'open')
    .eq('region', region)
    .eq('category', '디저트')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  if (error) throw error
  if (!data || data.length === 0) return null

  const nearest = data
    .map((row) => ({ row, distance: haversineMeters(lat, lng, row.lat, row.lng) }))
    .sort((a, b) => a.distance - b.distance)[0]
  return nearest ? toViewModel(nearest.row) : null
}
