// 일본 본토+오키나와를 감싸는 bounding box 여러 개의 합집합 + 한반도 부속도서 제외 구역.
// 단일 사각형(위도 24~46, 경도 122~146)으로 하면 그 범위가 한반도 전역(서울·춘천 등)까지 덮어버려
// 한국에서 접속해도 "일본"으로 오판정되는 버그가 있었음(2026-08-24 사용자 리포트 — 실제로 강원도
// 춘천 좌표가 일본으로 잡힘). 서쪽 경계를 좁혀서(경도 129.2) 고쳤더니 이번엔 대마도(경도 129.1~129.5,
// 실제 일본령)가 함께 잘려나가 좁은 위도 대역(34.0~34.75)만 서쪽으로 살짝 더 열어줬는데, 그 위도대에서
// 서쪽 경계를 더 열면 부산(경도 129.08)이 다시 걸리는 문제가 있어 대마도 전용 사각형은 경도 129.1부터
// (부산보다 동쪽) 시작하도록 분리했다. 그래도 울릉도(경도 130.9)·독도(경도 131.9)는 본토 사각형
// 안쪽에 위치해 걸리므로, 이 둘의 좁은 좌표 범위만 명시적 제외 구역으로 뺐다.
const JAPAN_BOUNDS_LIST = [
  // 혼슈+시코쿠+큐슈+홋카이도 본토. 서쪽 경계 129.2는 부산(129.08)을 피하기 위한 값 — 대마도는
  // 이 경계보다 서쪽이라 아래 별도 사각형에서 처리한다.
  { minLat: 30, maxLat: 46, minLng: 129.2, maxLng: 146 },
  // 대마도(일본령) — 위도 34.0~34.75의 좁은 섬만 서쪽 경도 129.1까지 열어둠. 부산은 위도 35.18이라
  // 이 좁은 위도 대역 밖이라 걸리지 않는다.
  { minLat: 34.0, maxLat: 34.75, minLng: 129.1, maxLng: 129.2 },
  // 오키나와(본토와 멀리 떨어진 남서쪽 섬들, 위도가 낮아 다른 사각형과 안 겹침).
  { minLat: 24, maxLat: 27.5, minLng: 122, maxLng: 132 },
]

// 위 본토 사각형 안에 좌표상 걸리지만 실제로는 한국 영토인 울릉도·독도만 명시적으로 제외한다.
const KOREA_EXCLUSION_ZONES = [{ minLat: 37.0, maxLat: 38.0, minLng: 130.7, maxLng: 132.2 }]

export function isInJapan(lat, lng) {
  const inJapanBox = JAPAN_BOUNDS_LIST.some(
    (b) => lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng
  )
  if (!inJapanBox) return false
  const inKoreaExclusion = KOREA_EXCLUSION_ZONES.some(
    (b) => lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng
  )
  return !inKoreaExclusion
}
