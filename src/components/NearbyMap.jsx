import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, MarkerF, OverlayViewF, useJsApiLoader } from '@react-google-maps/api'
import { IconClose, IconCoffee, IconUtensils } from './icons'
import { isDessertLikeCategory } from '../lib/restaurants'

// RestaurantDetailPage의 지도는 iframe 기반 Google Maps Embed API라 마커를 여러 개 찍거나 클릭 이벤트를
// 받을 수 없다(cross-origin iframe이라 내부 DOM에 부모 페이지가 접근 불가) — "내 근처 맛집"은 사용자
// 위치 마커 + 여러 가게 마커 + 클릭 시 정보창이 필요해서 이 페이지만 Maps JavaScript API를 별도로 로드한다.
// 같은 VITE_GOOGLE_MAPS_EMBED_API_KEY를 재사용하되, Google Cloud Console에서 이 키에 "Maps JavaScript API"가
// 추가로 활성화돼 있어야 동작한다(Embed API와는 별개 API라 권한이 따로 필요).
const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY

const containerStyle = { width: '100%', height: '100%' }

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  // 구글 기본 POI(음식점/카페 등) 아이콘·라벨을 꺼서 커스텀 마커와 겹쳐 보이지 않게 한다 — clickableIcons:
  // false는 클릭만 막을 뿐 아이콘 자체는 계속 그려지므로, 스타일 레이어로 POI를 통째로 숨겨야 한다.
  styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
}

// 일반적인 도보 속도(시속 4km, 분속 약 67m) 기준 환산. distanceMeters는 직선거리(하버사인)라 실제 도로를
// 따라가는 거리보다 짧게 나올 수 있음 — 참고용 추정치이며, 정확한 경로 거리는 Directions API가 필요.
const WALK_METERS_PER_MINUTE = 67

function toWalkMinutes(distanceMeters) {
  return Math.max(1, Math.round(distanceMeters / WALK_METERS_PER_MINUTE))
}

// 카페/디저트/베이커리는 "식당"과 다른 색·아이콘으로 구분해서 지도에서 한눈에 갈릴 수 있게 한다 — 카테고리
// 판별은 restaurants.js의 isDessertLikeCategory를 그대로 써서 NearbyPage의 필터와 기준을 통일한다.
function isCafeLike(category) {
  return isDessertLikeCategory(category)
}

const MARKER_COLOR = {
  restaurant: '#6D28D9', // brand-navy
  cafe: '#EE7191', // brand-pink — index.css의 로고 벚꽃 색상(--color-brand-pink)과 동일
}

// 포크&나이프(식당) / 컵(카페류) 아이콘이 든 핀을 SVG data URI로 그린다. 핀 자체는 색으로 채우고, 그 안에
// 흰 원형 배지를 얹은 뒤 그 위에 같은 색 아이콘을 그리는 방식(레퍼런스 디자인 참고, 2026-08-24). MarkerF의
// icon prop은 path 기반 심볼 아니면 이미지 URL만 받으므로, 복합 모양(핀+원+아이콘)을 내려면 이 방식이 가장 간단하다.
function buildPinIcon(kind) {
  const color = MARKER_COLOR[kind]
  const glyph =
    kind === 'cafe'
      ? `<path d="M6 9h11v5a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V9Z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M8 6.5c0-1 .8-1 .8-2S8 3 8 3" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/><path d="M12 6.5c0-1 .8-1 .8-2S12 3 12 3" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`
      : `<path d="M9 3v6a1.5 1.5 0 0 1-3 0V3M7.5 9v9" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/><path d="M16 3c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4v7" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <path d="M22 55C22 55 40 34.5 40 20A18 18 0 0 0 4 20C4 34.5 22 55 22 55Z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="22" cy="20" r="14" fill="white"/>
      <g transform="translate(10, 8)">${glyph}</g>
    </svg>
  `.trim()
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 56),
    anchor: new window.google.maps.Point(22, 56),
  }
}

// 정보창(말풍선) 카드가 마커 위로 떠 있어서, 마커 좌표를 그대로 지도 중심으로 잡으면 마커+말풍선
// 블록 전체는 화면 중앙보다 위로 치우쳐 보인다 — panBy로 지도를 아래로 이동시켜(=마커가 화면상
// 아래로 내려가) 마커+말풍선을 합친 블록의 세로 중심이 화면 정중앙에 오게 한다. 값은 실제 렌더링된
// 카드 높이(~105px, getPixelPositionOffset의 y: -height-46 여백 포함)로 boundingBox 실측 후 조정한 값 —
// 카드 내용(폰트 크기, padding 등)이 크게 바뀌면 이 값도 함께 재조정해야 함.
const INFO_CARD_VERTICAL_OFFSET = 76
// 카드 자체 높이(~105px) + getPixelPositionOffset의 마커-카드 간격(46px) = 마커 앵커부터 카드 상단까지의
// 거리. 아래 useEffect에서 지도가 작을 때 offset 상한을 계산하는 데 씀 — 위 실측값과 같은 이유로 카드
// 내용이 바뀌면 이 값도 같이 재조정해야 함.
const CARD_BLOCK_HEIGHT = 151
// 카드의 min-w/max-w(아래 JSX의 min-w-[270px] max-w-[270px])와 반드시 같은 값이어야 함 — 가로 방향
// clamp 계산에 씀. 카드 폭을 바꾸면 이 값도 함께 수정할 것.
const CARD_WIDTH = 270
// xl(1280px) 이상에서의 카드 폭(아래 JSX의 xl:min-w-[360px] xl:max-w-[360px])과 같은 값이어야 함.
const CARD_WIDTH_XL = 360

export default function NearbyMap({ userLocation, restaurants, selectedId, onSelectRestaurant }) {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'gurume-tabi-google-map-script',
    googleMapsApiKey: MAP_API_KEY,
  })

  // selectedId 또는 restaurants가 바뀔 때 실행 — center prop을 직접 오프셋시키는 방식은 줌 레벨마다
  // 픽셀당 위경도 비율이 달라져 부정확하므로, panBy(픽셀 단위)로 지도 중심을 옮긴 뒤 그만큼 다시 화면을
  // 내려 보정한다. restaurants도 dependency에 포함시킨 이유: 상세 페이지에서 뒤로가기로 돌아왔을 때
  // selectedId는 URL 쿼리에서 즉시 복원되지만 restaurants는 비동기 fetch라 아직 빈 배열일 수 있어서,
  // selectedId만 보면 target을 못 찾고 그대로 리턴해버려 지도가 이동하지 않는 문제가 있었다.
  useEffect(() => {
    const map = mapRef.current
    const target = restaurants.find((r) => r.id === selectedId)
    if (!map || !target) return
    // 지도가 작을 때(모바일의 h-[356px] 등) 고정 오프셋을 그대로 적용하면 카드 상단이 지도 위쪽 경계
    // 밖으로 밀려나 잘려 보이는 문제가 있었다(사용자 스크린샷으로 발견) — 마커는 지도 중앙보다
    // offset만큼 아래에 위치하고, 카드는 마커보다 CARD_BLOCK_HEIGHT(카드 높이+마커·카드 간격)만큼
    // 위에 있으므로, "카드 상단 = mapHeight/2 - offset - CARD_BLOCK_HEIGHT"가 여유 공간(8px) 밑으로
    // 내려가지 않도록 offset 상한을 지도 높이에 맞춰 다시 계산한다.
    const mapHeight = map.getDiv()?.offsetHeight ?? 0
    const mapWidth = map.getDiv()?.offsetWidth ?? 0
    const maxOffsetForMapHeight = mapHeight > 0 ? mapHeight / 2 - CARD_BLOCK_HEIGHT - 8 : INFO_CARD_VERTICAL_OFFSET
    const verticalOffset = Math.max(0, Math.min(INFO_CARD_VERTICAL_OFFSET, maxOffsetForMapHeight))
    // setCenter 직후 곧바로 panBy를 호출하면 Google Maps 내부적으로 두 이동이 합쳐지지 못하고 panBy가
    // 무시되는 경우가 있었다(실측 시 카드가 지도 상단에 계속 잘려 보이는 문제로 발견 — panTo나
    // requestAnimationFrame 한 프레임 뒤로 미루는 정도로는 부족했고, 짧은 지연(200ms) 후에 호출해야
    // 안정적으로 반영됨을 boundingBox 실측으로 확인함).
    map.setCenter({ lat: target.lat, lng: target.lng })
    const timer = setTimeout(() => {
      // 카드는 마커를 기준으로 좌우 폭의 절반씩 뻗어나가는데(getPixelPositionOffset의 x: -width/2),
      // 마커가 지도 왼쪽/오른쪽 가장자리에 가까이 있으면 카드 절반이 지도 밖으로 잘려 보이는 문제가
      // 있었다(사용자 스크린샷으로 발견 — 세로 중앙 정렬과는 별개의, 원래부터 있던 가로 방향 버그).
      // getProjection으로 지도 중심의 픽셀 좌표를 구해서, 카드가 지도 좌우 경계를 넘는 만큼 지도를
      // 옆으로 밀어 카드가 항상 화면 안에 들어오게 한다. 카드 폭 자체가 xl(1280px) 이상에서 더 넓어지므로
      // (JSX의 xl:min-w-[360px]) window.innerWidth로 같은 브레이크포인트를 판별해 실제 렌더링된 폭과 맞춘다.
      let horizontalOffset = 0
      const projection = map.getProjection()
      if (projection && mapWidth > 0) {
        const bounds = map.getBounds()
        if (bounds) {
          const sw = projection.fromLatLngToPoint(bounds.getSouthWest())
          const scale = Math.pow(2, map.getZoom())
          const markerPoint = projection.fromLatLngToPoint({ lat: target.lat, lng: target.lng })
          const markerX = (markerPoint.x - sw.x) * scale
          const cardWidth = window.innerWidth >= 1280 ? CARD_WIDTH_XL : CARD_WIDTH
          const halfCardWidth = cardWidth / 2
          if (markerX - halfCardWidth < 0) {
            horizontalOffset = markerX - halfCardWidth - 8
          } else if (markerX + halfCardWidth > mapWidth) {
            horizontalOffset = markerX + halfCardWidth - mapWidth + 8
          }
        }
      }
      map.panBy(horizontalOffset, -verticalOffset)
    }, 200)
    return () => clearTimeout(timer)
  }, [selectedId, restaurants])

  // 초기 중심은 항상 사용자 위치 — 카드를 선택했을 때의 이동은 위 useEffect의 setCenter/panBy가 담당한다.
  // useMemo로 감싸는 이유: {lat, lng} 리터럴을 매 렌더 새로 만들면 참조가 계속 바뀌어서, @react-google-maps/api가
  // "center prop이 바뀌었다"고 판단해 내부적으로 map.setCenter(center)를 다시 호출한다 — 이게 useEffect의
  // setCenter/panBy 결과를 리렌더링마다 되돌려버려서, 카드를 연속으로 여러 번 선택하면(예: A 선택 후 곧바로 B
  // 선택) 두 번째 이동에서 지도가 여전히 사용자 위치를 중심으로 유지되며 정보창이 지도 밖으로 잘리는 버그가
  // 있었다(사용자 스크린샷으로 발견 — getCenter()가 target 좌표가 아니라 계속 userLocation을 가리키고 있었음).
  // userLocation.lat/lng 값 자체가 안 바뀌는 한 같은 객체 참조를 재사용해서 이 재적용을 막는다.
  const center = useMemo(() => ({ lat: userLocation.lat, lng: userLocation.lng }), [userLocation.lat, userLocation.lng])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-[#f9f8fc] rounded-2xl">
        지도를 불러오지 못했어요.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-[#f9f8fc] rounded-2xl">
        지도를 불러오는 중이에요...
      </div>
    )
  }

  const selected = restaurants.find((r) => r.id === selectedId) ?? null

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      options={MAP_OPTIONS}
      onLoad={(map) => {
        mapRef.current = map
      }}
      onUnmount={() => {
        mapRef.current = null
      }}
    >
      <MarkerF
        position={{ lat: userLocation.lat, lng: userLocation.lng }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FFD500',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
        title="내 위치"
        zIndex={999}
      />

      {restaurants.map((r) => {
        const kind = isCafeLike(r.category) ? 'cafe' : 'restaurant'
        return (
          <MarkerF
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            icon={buildPinIcon(kind)}
            onClick={() => onSelectRestaurant(r.id)}
          />
        )
      })}

      {selected && (
        // Google Maps InfoWindow는 내부에 항상 자체 헤더 슬롯 + padding + 스크롤 컨테이너를 강제로 그려서
        // (title 미사용 시에도 빈 슬롯이 남고, CSS로 눌러도 X 버튼 위치 계산이 함께 깨짐) 커스텀 카드 UI와
        // 계속 충돌했다 — OverlayView는 Google이 위경도→픽셀 좌표 변환만 해주고 내부 DOM은 전부 우리가
        // 그리는 순수 React 콘텐츠라 이 문제 자체가 생기지 않는다.
        <OverlayViewF
          position={{ lat: selected.lat, lng: selected.lng }}
          mapPaneName="floatPane"
          getPixelPositionOffset={(width, height) => ({ x: -width / 2, y: -height - 46 })}
        >
          <div className="relative bg-white rounded-2xl shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] p-[16.8px] min-w-[270px] max-w-[270px] xl:min-w-[360px] xl:max-w-[360px]">
            <button
              type="button"
              onClick={() => onSelectRestaurant(null)}
              aria-label="닫기"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <IconClose className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/place/${selected.id}`, { state: { from: 'nearby' } })}
              className="flex items-start gap-3 pr-4 text-left cursor-pointer group/infowindow"
            >
              <span
                className="flex-none w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: MARKER_COLOR[isCafeLike(selected.category) ? 'cafe' : 'restaurant'] }}
              >
                {isCafeLike(selected.category) ? (
                  <IconCoffee className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                ) : (
                  <IconUtensils className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                )}
              </span>
              <span className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-bold text-gray-900 leading-snug break-keep line-clamp-2 xl:line-clamp-1 group-hover/infowindow:underline">
                  {selected.name}
                </span>
                <span className="text-xs text-gray-500">
                  {selected.category}
                  {selected.distanceMeters != null && ` · 도보 ${toWalkMinutes(selected.distanceMeters)}분`}
                </span>
                <span className="inline-flex items-center self-start gap-1 text-xs font-bold text-brand-coral-dark bg-brand-peach/50 rounded-full px-2 py-0.5">
                  ★ {selected.rating} ({selected.reviewCount})
                </span>
              </span>
            </button>
            {/* 말풍선 꼬리 — 카드 하단 중앙에서 마커를 가리키도록 회전된 정사각형 */}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
          </div>
        </OverlayViewF>
      )}
    </GoogleMap>
  )
}
