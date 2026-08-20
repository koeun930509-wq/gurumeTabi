import { supabase } from './supabaseClient'
import { isOpenNow } from '../utils/businessHours'

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
    openingHours: row.opening_hours ?? null,
    // Google businessStatus(폐업 여부, row.status)와 별개로 지금 이 순간 영업 중인지를 opening_hours로 계산한다.
    // 값이 null이면 아직 opening_hours를 못 채운 가게(재수집 전)라 뱃지 표시 여부는 UI에서 status로 폴백한다.
    isOpenNow: row.status === 'closed' ? false : isOpenNow(row.opening_hours),
    acceptsCard: row.accepts_card ?? false,
    walkMinutes: row.walk_minutes ?? null,
    nearestStation: row.nearest_station ?? null,
    acceptsReservation: row.accepts_reservation ?? false,
    businessHours: row.business_hours ?? null,
    regularHoliday: row.regular_holiday ?? null,
    budgetDinner: row.budget_dinner ?? null,
    budgetLunch: row.budget_lunch ?? null,
    hotpepperUrl: row.hotpepper_url ?? null,
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

// PostgREST(Supabase)는 명시적으로 range를 안 주면 기본 1000행까지만 반환한다 — restaurants가
// 1000행을 넘어선 뒤로 검색 결과가 뒷부분 지역/카테고리를 통째로 빠뜨리는 버그가 있었음
// (예: "오사카" 검색이 187곳 중 149곳만 나옴 — 나머지 38곳이 1000행 밖에 있었음). 1000행씩
// 페이지네이션해서 전체를 모아온다.
export async function fetchRestaurants() {
  const pageSize = 1000
  let from = 0
  const all = []
  while (true) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all.map(toViewModel)
}

// 스크랩 페이지처럼 id 목록이 이미 정해져 있을 때 전체 4천여 건을 다 불러오지 않고 그 id들만 조회한다.
export async function fetchRestaurantsByIds(ids) {
  if (!ids || ids.length === 0) return []
  const { data, error } = await supabase.from('restaurants').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []).map(toViewModel)
}

// "케이크"처럼 메뉴가 가게명/카테고리에 안 들어가도 리뷰에 언급된 가게를 찾기 위한 함수.
// 전체 4천여 곳을 리뷰까지 조회하면 PostgREST가 statement timeout(500)으로 죽는 사고가 있었어서
// (fetchRestaurants()에 reviews_cache join을 넣었다가 검색 결과 전체가 0건이 되는 회귀 발생, 2026-08-20),
// 디저트류를 파는 카페/디저트/베이커리 카테고리(합쳐서 700곳 이하)로만 후보를 좁혀 리뷰를 조회한다.
const DESSERT_LIKE_CATEGORIES = ['카페', '디저트', '베이커리']

export async function fetchDessertLikeRestaurantsWithReviews() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, reviews_cache(*)')
    .in('category', DESSERT_LIKE_CATEGORIES)
  if (error) throw error
  return (data ?? []).map(toViewModel)
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
