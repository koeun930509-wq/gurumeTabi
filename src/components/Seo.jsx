const SITE_NAME = 'Gurume Tabi'
const SITE_URL = 'https://gurume-tabi.com'
const DEFAULT_IMAGE = `${SITE_URL}/simbol.png`

function truncate(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

// React 19는 컴포넌트가 렌더링하는 <title>/<meta>/<link>를 자동으로 문서 <head>로 끌어올린다
// (별도 라이브러리 없이 동작) — 페이지 이동 시 이 컴포넌트만 새로 렌더링되면 head도 함께 갱신된다.
export default function Seo({ title, description, path = '', image = DEFAULT_IMAGE, noIndex = false }) {
  const url = `${SITE_URL}${path}`
  // 가게명처럼 가변 길이 텍스트가 조합되는 페이지가 있어, 여기서 한 번 더 안전하게 잘라준다
  // (구글 title 50자·description 150자 권장 기준 — 넘으면 검색 결과에서 자동으로 잘리지만, 자연스러운
  // 위치에서 말줄임표로 미리 자르는 편이 중간에 뚝 끊기는 것보다 낫다).
  const safeTitle = truncate(title, 50)
  const safeDescription = truncate(description, 150)

  return (
    <>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={image} />
    </>
  )
}
