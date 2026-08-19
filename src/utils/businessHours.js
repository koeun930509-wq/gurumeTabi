// Google Places regularOpeningHours.periods를 기준으로 "지금 영업중"을 일본 현지 시각(Asia/Tokyo)으로 계산한다.
// 한국과 일본은 시차가 없지만(둘 다 UTC+9), 해외에서 접속하는 사용자도 있으므로 타임존을 명시해 정확히 맞춘다.
// periods 형태: [{ open: { day, hour, minute }, close?: { day, hour, minute } }, ...] (day: 0=일요일 ~ 6=토요일)
// close가 없는 항목은 Google이 24시간 영업을 표현하는 방식이다.
export function isOpenNow(openingHours, now = new Date()) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return null
  if (openingHours.some((p) => p.open && !p.close)) return true

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const WEEKDAY_TO_DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const nowDay = WEEKDAY_TO_DAY[parts.find((p) => p.type === 'weekday').value]
  const nowHour = Number(parts.find((p) => p.type === 'hour').value)
  const nowMinute = Number(parts.find((p) => p.type === 'minute').value)
  const nowTotal = nowDay * 1440 + nowHour * 60 + nowMinute

  return openingHours.some((period) => {
    if (!period.open || !period.close) return false
    const openTotal = period.open.day * 1440 + period.open.hour * 60 + period.open.minute
    let closeTotal = period.close.day * 1440 + period.close.hour * 60 + period.close.minute
    if (closeTotal <= openTotal) closeTotal += 7 * 1440

    if (nowTotal >= openTotal && nowTotal < closeTotal) return true
    // 자정을 넘겨 다음 주로 이어지는 영업(예: 토요일 심야 → 일요일 새벽)을 이번 주 기준으로도 판정
    return nowTotal + 7 * 1440 >= openTotal && nowTotal + 7 * 1440 < closeTotal
  })
}

// 카드/상세 페이지의 영업 상태 뱃지 키를 결정한다.
// status가 'closed'(Google businessStatus 기준 폐업)면 실시간 계산과 무관하게 항상 휴무로 표시하고,
// status가 'open'이어도 restaurant.isOpenNow(opening_hours 기반 실시간 계산)가 false면 영업종료로 내린다.
// isOpenNow가 null(opening_hours 미수집)이면 기존처럼 status만으로 판정해 폴백한다.
export function resolveStatusKey(restaurant) {
  if (restaurant.status === 'closed' || restaurant.status === 'soldout') return restaurant.status
  if (restaurant.isOpenNow === false) return 'closed_now'
  return 'open'
}
