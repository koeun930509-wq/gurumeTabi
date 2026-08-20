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

// 핫페퍼 grume 텍스트(business_hours, 한글 자유 텍스트)를 isOpenNow가 먹는 periods 형식으로 변환한다.
// Google opening_hours가 없는 가게(전체의 약 15%)도 핫페퍼로 보강된 경우가 많아(그중 약 73%),
// 이 텍스트를 파싱해 실시간 판정에 쓸 수 있으면 "영업종료"로 정직하게 보여줄 수 있는 범위가 늘어난다.
// 예) "월~금, 공휴일 전날: 11:30~15:00 (요리 L.O. 21:30) 일, 공휴일: 11:30~21:00 (요리 L.O. 20:00)"
// "공휴일"/"공휴일 전날"은 일본 공휴일 데이터가 없어 무시하고 요일 부분만 사용한다 — 정확도보다
// "완전히 틀리지는 않는" 근사치를 목표로 함(자유 텍스트라 100% 파싱은 불가능).
const DAY_NAME_TO_INDEX = {
  일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
  // Cloud Translation API가 요일 한자(月火水木金土日)를 다의어로 오역해 섞여 나온 표기들
  // (예: 火→"불", 水→"물"/"나무", 木→"나무") — 완벽하진 않지만 흔한 오역 패턴만 구제한다.
  불: 2, 물: 3, 나무: 4,
}
const DAY_TOKEN_RE = /[일월화수목금토불물]|나무/g

function parseDayGroup(dayText) {
  const days = new Set()
  // "월~금", "토, 일" 등을 세그먼트로 나눠 각각 처리
  for (const segment of dayText.split(/[,、]/)) {
    const range = segment.split('~').map((s) => s.match(DAY_TOKEN_RE)?.[0]).filter(Boolean)
    if (range.length === 2) {
      const [start, end] = range.map((d) => DAY_NAME_TO_INDEX[d])
      if (start === undefined || end === undefined) continue
      for (let d = start; ; d = (d + 1) % 7) {
        days.add(d)
        if (d === end) break
      }
    } else if (range.length === 1) {
      const d = DAY_NAME_TO_INDEX[range[0]]
      if (d !== undefined) days.add(d)
    }
  }
  return [...days]
}

// 요일(들) 뒤에 시간 구간이 붙는 청크를 순서대로 뽑는다. 콜론은 있을 수도 없을 수도 있어(핫페퍼
// 원문 표기가 일관되지 않음, 예: "월~금 11:30~15:00"처럼 콜론이 아예 빠진 케이스도 실제로 있었음
// — 2026-08-20 "아사쿠사 츠루지로" 사례) 선택적으로 처리한다. 뒤이어 "요일(+콜론)+숫자" 패턴이
// 나오기 전까지를 그 청크의 시간부로 잡는 lookahead 방식 — 단순히 "다음 콜론까지"로 자르면
// "공휴일 전날: 11:30~15:00 (...) 일, 공휴일: 11:30~21:00"처럼 여러 요일 그룹이 한 문장에 이어질 때
// 두 번째 그룹부터 시간이 통째로 잘려나가는 문제가 있었음(첫 번째 청크가 "일:" 앞 콜론에서 끊김).
const CHUNK_RE = /([일월화수목금토][일월화수목금토~,、\s]*)[:：]?\s*((?:(?![일월화수목금토]\s*[:：]?\s*\d).)*)/g

export function parseBusinessHoursText(text) {
  if (!text) return null
  // "(요리 L.O. 23:00 음료 L.O. 23:30)" 같은 라스트오더 안내는 실시간 판정에 불필요해 먼저 제거
  let cleaned = text.replace(/\([^)]*L\.?O\.?[^)]*\)/g, ' ')
  // "공휴일"/"공휴일 전날"/"공휴일 전일"은 일본 공휴일 데이터가 없어 판정에서 무시하는데, 이 문구
  // 안의 "일"(공휴+일) 글자가 요일 나열로 오인되어 청크 경계를 잘못 잡는 문제가 있었음 — 요일 청크를
  // 찾기 전에 먼저 통째로 제거해 이 글자 자체가 매칭 대상에서 사라지게 한다.
  cleaned = cleaned.replace(/,?\s*공휴일\s*전[날일]/g, '').replace(/,?\s*공휴일/g, '')

  CHUNK_RE.lastIndex = 0
  const periods = []
  let chunkMatch
  while ((chunkMatch = CHUNK_RE.exec(cleaned))) {
    const days = parseDayGroup(chunkMatch[1])
    if (days.length === 0) continue
    const timeText = chunkMatch[2]
    const timeRe = /(다음날?\s*)?(\d{1,2}):(\d{2})\s*[~-]\s*(다음날?\s*)?(\d{1,2}):(\d{2})/g
    let match
    while ((match = timeRe.exec(timeText))) {
      const [, , oh, om, closeNextDay, ch, cm] = match
      const openHour = Number(oh)
      const openMinute = Number(om)
      let closeHour = Number(ch)
      const closeMinute = Number(cm)
      // "다음 N시"(자정을 넘겨 다음날 새벽까지 영업)는 종료 시각에 24를 더해 같은 날 기준으로 표현
      if (closeNextDay || closeHour < openHour || (closeHour === openHour && closeMinute <= openMinute)) {
        closeHour += 24
      }
      for (const day of days) {
        const closeDay = (day + Math.floor(closeHour / 24)) % 7
        periods.push({
          open: { day, hour: openHour, minute: openMinute },
          close: { day: closeDay, hour: closeHour % 24, minute: closeMinute },
        })
      }
    }
  }
  return periods.length > 0 ? periods : null
}

// 카드/상세 페이지의 영업 상태 뱃지 키를 결정한다.
// status가 'closed'(Google businessStatus 기준 폐업)면 실시간 계산과 무관하게 항상 휴무로 표시하고,
// status가 'open'이어도 restaurant.isOpenNow(opening_hours 기반 실시간 계산)가 false면 영업종료로 내린다.
// isOpenNow가 null(opening_hours 미수집이라 실시간 판정이 불가능한 경우)이면 'unknown'을 반환한다.
// 예전에는 이 경우 무조건 'open'으로 폴백했는데, opening_hours가 없는 가게(전체의 약 15%)가
// 실제 영업 여부와 무관하게 항상 "영업중"으로 표시되는 문제가 있었음(2026-08-20 발견) — 정보가
// 없으면 모른다고 보여주는 게 틀린 답을 단정하는 것보다 낫다는 판단으로 변경.
export function resolveStatusKey(restaurant) {
  if (restaurant.status === 'closed' || restaurant.status === 'soldout') return restaurant.status
  if (restaurant.isOpenNow === false) return 'closed_now'
  if (restaurant.isOpenNow === true) return 'open'
  return 'unknown'
}
