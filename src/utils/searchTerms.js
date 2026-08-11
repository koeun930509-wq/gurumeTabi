export const FOOD_TYPES = [
  '스시', '라멘', '소바', '우동', '오코노미야키', '타코야키', '쿠시카츠', '돈부리',
  '장어덮밥', '텐동', '돈카츠', '모츠나베', '스키야키', '오뎅', '카레', '오무라이스',
  '야키소바', '몬자야키', '디저트', '카페',
]

export const REGIONS = ['도쿄', '오사카', '후쿠오카', '나고야', '삿포로', '오키나와', '기타']

// 일본어 음차 표기 흔들림 정규화 — "오코노미야키/오꼬노미야끼", "타코야키/타코야끼" 같은
// 평음(ㄱㄷㅂㅅㅈ)·경음(ㄲㄸㅃㅆㅉ)·격음(ㅋㅌㅍㅊ) 표기 차이를 흡수한다.
// 초성을 같은 조음 계열의 대표(평음)로 치환한 뒤 비교하면, 어느 쪽으로 입력해도 같은 단어로 매칭된다.
const CHO_TO_PLAIN = {
  1: 0, 15: 0, // ㄲ, ㅋ → ㄱ
  4: 3, 16: 3, // ㄸ, ㅌ → ㄷ
  8: 7, 17: 7, // ㅃ, ㅍ → ㅂ
  10: 9, // ㅆ → ㅅ
  13: 12, 14: 12, // ㅉ, ㅊ → ㅈ
}

export function normalizeJapaneseTranscription(str) {
  return str
    .split('')
    .map((ch) => {
      const code = ch.codePointAt(0)
      if (code < 0xac00 || code > 0xd7a3) return ch
      const offset = code - 0xac00
      const cho = Math.floor(offset / (21 * 28))
      const jung = Math.floor((offset % (21 * 28)) / 28)
      const jong = offset % 28
      const newCho = CHO_TO_PLAIN[cho] ?? cho
      return String.fromCodePoint(0xac00 + (newCho * 21 + jung) * 28 + jong)
    })
    .join('')
}

export function suggestFoodTypes(input, limit = 5) {
  const query = input.trim()
  if (!query) return []
  const normalizedQuery = normalizeJapaneseTranscription(query)
  return FOOD_TYPES.filter((food) =>
    normalizeJapaneseTranscription(food).includes(normalizedQuery)
  ).slice(0, limit)
}
