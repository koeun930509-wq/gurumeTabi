# DESIGN.md — Gurume Tabi 디자인 가이드 (실제 구현 기준)

> 이 문서는 `src/index.css`·`src/pages/*.jsx`·`src/components/*.jsx`에 **실제로 구현되어 있는** 값을 기준으로 정리한 요약본입니다.
> 더 상세한 토큰/컴포넌트 스펙과 그 배경(왜 이 톤인지)은 `design-system/MASTER.md`를 참고하세요 — 단, `design-system/`은 `ui-ux-pro-max` 스킬로 만든 별도 프로토타입 문서라 실제 React 소스와 완전히 동기화되어 있지 않을 수 있습니다. **값이 다르면 이 문서와 `src/index.css`(실제 코드)를 우선하세요.**

---

## 1. 브랜드 톤

신뢰(광고에 속지 않는다) + 안심(대안이 항상 있다)을 핵심 가치로 삼는 "검증 도구" 톤. 화려한 마켓플레이스식 CTA보다 담백하고 데이터 중심적인 인상을 우선합니다.

## 2. 컬러 토큰 (`src/index.css`의 `@theme`)

Tailwind v4 사용, **`tailwind.config.js` 없음** — 아래 값이 유일한 source of truth입니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-brand-navy` | `#6D28D9` | 주색 — 헤더 텍스트, 주요 버튼 |
| `--color-brand-navy-dark` | `#4C1D95` | 주색 다크 변형 |
| `--color-brand-coral` | `#A855F7` | 강조색 — CTA, 영업 상태 경고, 로그인 오버레이 |
| `--color-brand-coral-dark` | `#7E22CE` | 강조색 다크 변형 |
| `--color-brand-peach` | `#EDE4FB` | 보조색 — 카드 배경, 구분선, hover 배경 |
| `--color-brand-peach-dark` | `#DCC9F5` | 보조색 다크 변형 |
| `--color-brand-pink` | `#EE7191` | "근처 디저트 맛집" 전용 강조색(로고 벚꽃/별과 동일 톤) — `brand-coral`과 다른 색이니 혼동 금지 |
| `--color-brand-pink-dark` | `#D94F74` | 핑크 다크 변형 |
| `--color-status-open` | `#2F9E5B` | 영업중 배지 |
| `--color-status-closed` | `#6B7280` | 휴무/영업종료 배지 |
| `--color-status-soldout` | `#DC2626` | 재료소진 배지 |

`bg-brand-coral`, `text-brand-navy` 등으로 사용(Tailwind 기본 팔레트가 아니므로 이 이름이어야만 적용됨).

**Body 배경**: `index.css`에 전역 그라디언트 직접 지정(Tailwind 유틸리티 아님) — `linear-gradient(135deg, #9993e2 0%, #f3e8ff 45%, #ffb194 100%)`, `background-attachment: fixed`.

## 3. 타이포그래피

- **주 폰트**: Pretendard (한글 가독성 최적화)
- **폰트 크기 스케일 — Tailwind 기본값이 아니라 한 단계씩 상향 오버라이드됨**:

| 클래스 | 실제 값 |
|---|---|
| `text-xs` | 14px (0.875rem) |
| `text-sm` | 16px (1rem) |
| `text-base` | 18px (1.125rem) |
| `text-lg` | 20px (1.25rem) |
| `text-xl` | 24px (1.5rem) |
| `text-2xl` | 28px (1.75rem) |

새 화면 작업 시 픽셀 값을 Tailwind 기본 스케일로 가정하지 말고 항상 위 표(또는 `src/index.css`)를 먼저 확인할 것.

## 4. 로고 & 미디어

- 로고: `public/logo.png` (후지산·벚꽃·덮밥 심볼 + "Gurume Tabi" 워드마크). 헤더(`Header.jsx`)와 사이드바(`Sidebar.jsx`, `/mypage`·`/scrap`)에서 **완전히 동일한** 여백·크기(`px-4 sm:px-6 py-6`, `h-[43.2px] sm:h-12`)로 통일 — 한쪽만 고치면 화면 전환 시 로고가 흔들림.
- 히어로 배경: 홈은 `public/sushi.mp4`(영상) + `bg-brand-navy-dark/35` 오버레이, 로그인/회원가입은 `public/loginBg.png`(이미지, 블러 없음) + 동일 오버레이.
- 대형 미디어(영상/풀블리드 히어로/로고)는 `public/`에서 절대경로로 참조(Vite 번들링 제외 의도), 장식용 소형 이미지는 `src/assets/`에서 `import`.

## 5. 여백 · 반경 · 스크롤

- 카드 반경: `rounded-2xl`(16px) 통일
- 스크롤 컨테이너: `/search`·`/scrap`·`/mypage`는 페이지 자체 `h-screen overflow-hidden` + 콘텐츠만 `overflow-y-scroll pretty-scroll`(항상 스크롤바 트랙 표시, 흰 배경 위에서는 `pretty-scroll-light`) — 뷰 전환 시 카드 폭이 흔들리지 않도록 하기 위함.
- **`overflow-y-scroll` 컨테이너 안 요소에는 음수 `margin-top` 금지** — 스크롤 박스 밖(위)으로 밀려나면 영구히 안 보이고 스크롤로도 복구 불가.

## 6. 아이콘

- `src/components/icons/index.jsx`의 커스텀 SVG 세트 사용(이모지 금지). `base()` 헬퍼가 기본 `width:24, height:24`를 주고 className이 있으면 그쪽 우선.
- 저장(별) 아이콘만 outline/filled 두 상태(미저장/저장됨) 허용, 나머지는 outline 통일.

## 7. 모션

- 마이크로 인터랙션 150~300ms, `ease-out` 위주
- 그리드 카드 사진 캐러셀: 필름스트립 방식 `translateX`(300ms ease-out) — `src` 교체나 `key` 재마운트 방식은 각각 즉시전환/깜빡임 문제로 폐기됨
- 홈 검색창 포커스: 브랜드 보라·로고 분홍 2색 `conic-gradient` 4px 보더 회전 애니메이션(`.gradient-border-input`, `index.css`)

## 8. 상태 배지 규칙

영업 상태는 2026-08-19부터 **일본 현지 시각 기준 실시간 계산**을 우선합니다(`src/utils/businessHours.js`의 `resolveStatusKey`):

| 상태 키 | 의미 | 조건 |
|---|---|---|
| `open` | 영업중 | `status !== 'closed'` && 지금 영업시간 내(또는 `opening_hours` 미수집 시 폴백) |
| `closed_now` | 영업종료(오늘 영업시간 지남) | `opening_hours` 있고 지금 문 닫음 |
| `closed` | 휴무/폐업 | Google `businessStatus` 기준 |
| `soldout` | 재료소진 | 현재 실데이터에는 없음(Google이 이 신호를 안 줌, UI 매핑만 존재) |

색만으로 구분하지 않고 항상 텍스트 동반.

## 9. 컴포넌트 재사용 원칙 (중복 수정 방지 체크리스트)

같은 UI가 여러 화면에 흩어져 있어, 한쪽만 고치기 쉬운 지점들:

- `SearchResultGridCard.jsx`(그리드) / `SearchResultCard.jsx`(리스트) — 해시태그·저장 버튼·영업 상태 뱃지 로직이 각 파일에 독립적으로 존재
- `Header.jsx`의 검색창 / `SearchResultsPage.jsx`의 재검색창(모바일·PC 2곳) — 검색 실행 로직(`addRecentSearch` 포함) 3곳 모두 동일하게 유지
- `AccountActions.jsx` — 헤더·마이페이지·스크랩에서 공용, 마크업을 각 파일에 복사하지 말 것
- `Footer.jsx` — 4개 화면에서 색상만 다르게 적용, 문구·폰트 크기는 이 파일 하나에서만 관리

## 10. 참고

- 상세 토큰/화면별 적용 근거: `design-system/MASTER.md`, `design-system/mockups/*.html`(standalone 프로토타입, 실제 라우트 아님)
- 프로젝트 전반 규칙: `CLAUDE.md`
- 기획: `PRD.md`
