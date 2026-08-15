// 흔한 한국 성씨 — 이걸로 시작하는 순수 한글 2~4자 문자열만 '실명'으로 간주해 마스킹한다.
// "가온아빠"/"빼꼼"/"센요" 같은 닉네임은 이 목록에 없는 글자로 시작하거나 5자 이상이라 자연히 제외됨.
const KOREAN_SURNAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
  '홍', '고', '문', '양', '손', '배', '조', '백', '허', '유',
  '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구',
  '나', '민', '진', '지', '엄', '채', '원', '천', '방', '공',
  '현', '함', '변', '염', '여', '추', '도', '소', '석', '선',
]

export function maskReviewAuthor(name) {
  if (!name) return name
  const isPureHangul = /^[가-힣]+$/.test(name)
  if (!isPureHangul) return name
  if (name.length < 2 || name.length > 4) return name
  if (!KOREAN_SURNAMES.includes(name[0])) return name
  return name.slice(0, 2) + '○'.repeat(name.length - 2)
}
