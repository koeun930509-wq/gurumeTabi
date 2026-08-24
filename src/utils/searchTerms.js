export const FOOD_TYPES = [
  '스시', '라멘', '소바', '우동', '오코노미야키', '타코야키', '쿠시카츠', '돈부리',
  '장어덮밥', '텐동', '돈카츠', '모츠나베', '스키야키', '오뎅', '카레', '오무라이스',
  '야키소바', '몬자야키', '디저트', '카페', '베이커리',
]

export const REGIONS = ['도쿄', '오사카', '후쿠오카', '나고야', '삿포로', '오키나와', '교토', '나라', '기타']

// 검색어 동의어 — DB 카테고리로는 없지만 사용자가 흔히 쓰는 표현을 실제 검색어로 치환한다.
// (예: "술집"으로 검색해도 가게명에 "이자카야"가 들어간 결과가 매칭되도록)
const SEARCH_SYNONYMS = {
  술집: '이자카야',
  돈까스: '돈카츠',
  빵집: '베이커리',
  커피: '카페',
  초밥: '스시',
  덮밥: '돈부리',
}

export function resolveSearchSynonym(token) {
  return SEARCH_SYNONYMS[token] ?? token
}

// 라멘은 DB에 육수 종류(쇼유/돈코츠/미소/시오 등)별 세부 카테고리 없이 전부 "라멘" 하나로 수집되어 있다.
// "쇼유 라멘"처럼 검색하면 "쇼유" 토큰이 매칭 실패해 결과가 0건이 되므로, 이런 육수 키워드는 무시해서
// "라멘" 토큰만으로 라멘 카테고리 전체가 나오도록 한다(0건 대신 폴백).
export const IGNORED_SEARCH_TOKENS = new Set(['맛집', '쇼유', '돈코츠', '미소', '시오'])

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

export function suggestSearchTerms(input, limit = 5) {
  const query = input.trim()
  if (!query) return []
  const normalizedQuery = normalizeJapaneseTranscription(query)
  return [...REGIONS, ...FOOD_TYPES]
    .filter((term) => normalizeJapaneseTranscription(term).includes(normalizedQuery))
    .slice(0, limit)
}
