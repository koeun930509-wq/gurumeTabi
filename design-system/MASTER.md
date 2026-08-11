# Gurume Tabi — Design System (MASTER)

> Source of truth. 모든 화면/컴포넌트는 이 문서의 토큰과 패턴을 따른다.
> 페이지별로 이 규칙에서 벗어나야 하면 `design-system/pages/<page>.md`에 override를 적고, 여기에는 없는 이유를 남긴다. override 파일이 없으면 이 문서를 그대로 따른다.
> Stack: **html-tailwind** (Tailwind CDN, standalone HTML). 실제 프로덕션 코드(React+Vite+Tailwind v4, `src/index.css`)의 값과 1:1로 맞춰져 있음 — 이 문서가 새 팔레트를 발명한 게 아니라 이미 구현된 토큰을 규격화한 것.
> Generated: 2026-08-11 · `ui-ux-pro-max` 스킬 검색 결과(Directory/Listing 패턴, Minimalism & Swiss + Trust & Authority 스타일) + PRD.md 7절 + 페르소나 워크시트(3.1) 종합. 자동 `--design-system` 산출물의 그린/마켓플레이스 팔레트는 페르소나 톤(신뢰·데이터 검증·실용주의)과 안 맞아 채택하지 않음 — 아래 §1의 이유 참고.

---

## 0. 왜 이 톤인가 (페르소나 워크시트 우선)

`ui-ux-pro-max`의 업종 일반 추천(요식업 → 활기찬 오렌지/레드, 마켓플레이스 → "호스트 되기" CTA 중심 비비드 그린)은 이 서비스에 맞지 않는다. 페르소나(PRD 3.1, 4단계 페르소나 워크시트)는:

- **김민준, 34세, IT 개발자** — "광고보다 데이터와 실제 방문 후기의 **객관적 검증**을 중시하는 실용주의자"
- 행동 습관: 평점 필터링 → 불친절 후기 제외 → 리뷰 정독 → **항상 백업 플랜 준비**
- 핵심 가치(PRD 1절): **신뢰**(광고에 속지 않는다) + **안심**(대안이 항상 있다)

→ 화려하게 "맛있어 보이게" 파는 푸드 앱이 아니라, **검증 도구**처럼 담백하고 믿을 수 있게 보여야 한다. 그래서:
- 자동 추천 스타일 중 **Minimalism & Swiss Style**(깨끗함, 여백, 기능 우선) + **Trust & Authority**(배지·인증 표현)만 채택하고, **Vibrant & Block-based / 마켓플레이스식 화려한 CTA는 anti-pattern으로 명시**한다.
- 자동 추천 패턴 중 **Directory / Listing**(검색이 곧 CTA, 필터형 그리드, 인증 배지)만 채택하고, **"Horizontal Scroll Journey"/"호스트 되기" 마켓플레이스 구조는 쓰지 않는다.**
- 컬러/폰트는 도구가 즉석에서 제안한 그린·오렌지·럭셔리 세리프가 아니라, **이미 구현되어 있고 페르소나 워크시트 과정에서 확정된 기존 브랜드 값**(§2, §3)을 그대로 SSOT로 삼는다.

---

## 1. 브랜드 톤

| 항목 | 값 |
|---|---|
| 톤 | 신뢰/안심형 (Verified & Reliable) — 담백하고 믿을 수 있는 인상 우선 |
| 성격 | 데이터 기반, 실용주의, 과장 없음, 광고 냄새 배제 |
| 채택 스타일 | Minimalism & Swiss Style + Trust & Authority 악센트 |
| 채택 구조 패턴 | Directory / Listing (검색 우선, 필터형 그리드, 인증 배지, 지도는 필요할 때만) |
| 금지 스타일 | Vibrant & Block-based, 마켓플레이스식 "호스트 되기" CTA, 화려한 그라디언트 배지, 이모지 아이콘 |

---

## 2. 컬러 토큰

기존 `src/index.css`의 Tailwind v4 `@theme` 값 그대로. 절대 새 색을 만들지 않는다.

```css
--color-brand-navy:       #6D28D9;  /* 주색 — 헤더, 주요 텍스트 강조, primary 버튼 */
--color-brand-navy-dark:  #4C1D95;  /* 다크모드 주색 */
--color-brand-coral:      #A855F7;  /* 강조색(행동 유도 전용) — 백업 플랜 CTA, 영업상태 경고, 로그인 오버레이 */
--color-brand-coral-dark: #7E22CE;
--color-brand-peach:      #EDE4FB; /* 보조색 — 카드 배경 강조, 구분선, hover 배경 */
--color-brand-peach-dark: #DCC9F5;

--color-status-open:      #2F9E5B; /* 영업중 배지 */
--color-status-closed:    #6B7280; /* 휴무 배지 */
--color-status-soldout:   #DC2626; /* 재료소진 배지 */
```

**Tailwind CDN 설정** (모든 목업 HTML 상단에 동일하게 삽입):

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'brand-navy': { DEFAULT: '#6D28D9', dark: '#4C1D95' },
          'brand-coral': { DEFAULT: '#A855F7', dark: '#7E22CE' },
          'brand-peach': { DEFAULT: '#EDE4FB', dark: '#DCC9F5' },
          'status-open': '#2F9E5B',
          'status-closed': '#6B7280',
          'status-soldout': '#DC2626',
        },
        fontFamily: { sans: ['Pretendard', '-apple-system', 'Segoe UI', 'Malgun Gothic', 'sans-serif'] },
      },
    },
  };
</script>
```

**사용 규칙**
- `brand-coral`은 행동 유도 요소 전용(백업 플랜 CTA, 영업 상태 경고, 로그인 오버레이). 장식용으로 남발하지 않는다 — 남발하면 "화려한 마켓플레이스" 톤으로 무너진다.
- 본문 텍스트는 `#362447`(기존 body color) 또는 `slate-900`류 고대비. 회색-on-회색 금지(§8 접근성).
- 상태색(영업중/휴무/소진)은 **색만으로 전달하지 않는다** — 항상 텍스트/아이콘 동반(WCAG `color-not-only`).
- 다크모드는 각 브랜드색의 `-dark` 변형을 그대로 쓰되, 반전(invert)하지 않는다.

---

## 3. 타이포그래피

- **주 폰트: Pretendard** (한글 가독성 최적화, 기존 구현값). `ui-ux-pro-max` 폰트 페어링 DB는 영문 전용(Lexend+Source Sans 3 "Corporate Trust"가 톤은 가장 근접하지만 한글 미지원)이라 그대로 쓰지 않고, 한글 서비스 표준인 Pretendard를 SSOT로 유지한다.
- CDN: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />`
- **폰트 스케일** (기존 구현값 — Tailwind 기본보다 한 단계 위로 상향, 여행 중 급하게 읽는 상황을 고려한 가독성 우선):

| Tailwind 클래스 | 실제 값 |
|---|---|
| `text-xs` | 14px |
| `text-sm` | 16px |
| `text-base` | 18px |
| `text-lg` | 20px |
| `text-xl` | 24px |
| `text-2xl` | 28px |

- **굵기 위계**: 헤딩 `font-bold`(700), 본문 `font-normal`(400), 라벨/배지 `font-medium`(500).
- 숫자(평점, 가격, 도보 분수)는 `tabular-nums` 사용 — 리스트에서 흔들리지 않게.
- 긴 상호명/주소는 줄바꿈 허용, 말줄임 시 `title` 속성으로 전체 텍스트 제공.

---

## 4. 여백 · 반경 · 그림자 (Density: 중간)

`--density` 다이얼은 중간(6/10) — 마케팅 랜딩처럼 널찍하지도, 대시보드처럼 빡빡하지도 않게. 리스트형 서비스에 맞춘 표준 8pt 스케일.

| 토큰 | 값 | 용도 |
|---|---|---|
| `space-1` | 4px | 아이콘-텍스트 간격 |
| `space-2` | 8px | 배지 내부 패딩, 컴포넌트 간 최소 간격 |
| `space-4` | 16px | 카드 내부 패딩 |
| `space-6` | 24px | 섹션 내 블록 간격 |
| `space-8` | 32px | 섹션 간 간격(모바일) |
| `space-12` | 48px | 섹션 간 간격(데스크톱) |

- **카드 반경**: `rounded-2xl`(16px) — 모든 카드/모달/시트 통일.
- **버튼 반경**: `rounded-xl`(12px) primary, `rounded-full` pill은 필터 칩/배지 전용.
- **그림자 스케일**: `shadow-sm`(카드 기본) → `shadow-md`(hover/press) → `shadow-lg`(sticky CTA, 모달). 임의의 shadow 값 사용 금지, 이 3단계만.
- **컨테이너**: 모바일 `px-4`, 태블릿 `md:px-6`, 데스크톱 `lg:px-8`, 최대 폭 `max-w-6xl mx-auto`.
- **브레이크포인트**: 375 / 768 / 1024 / 1440.

---

## 5. 모션 (Motion: 낮음~중간)

"신뢰형" 톤이므로 장식적 모션은 피한다. `--motion` 다이얼 3/10.

| 규칙 | 값 |
|---|---|
| 마이크로 인터랙션 | 150–250ms, `ease-out` (진입) / `ease-in` (이탈) |
| 대상 | `opacity`, `transform`만 애니메이션 (layout shift 유발 속성 금지) |
| 카드 press | `scale-[0.98]` 후 복귀 |
| 리스트 진입 | 최대 stagger 40ms/item, 3개 이상 겹치지 않게 |
| 금지 | 장식용 파티클/패럴랙스, 500ms 초과 트랜지션, 자동 캐러셀 |
| 접근성 | `prefers-reduced-motion: reduce` 시 전부 즉시 전환으로 대체 |

---

## 6. 아이콘

- 라이브러리: **Phosphor Icons** (`outline`/`regular` weight만, 필채우기 아이콘과 혼용 금지). 이모지 아이콘 절대 금지.
- CDN(standalone HTML용): `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"></script>` 후 `<i class="ph ph-star"></i>` 형태로 사용.
- 사이즈 토큰: `icon-sm`=16px(배지 내부), `icon-md`=20px(리스트/버튼), `icon-lg`=24px(헤더/내비).
- 스트로크 두께 통일(Phosphor regular 기본값), 화면 전체에서 섞지 않음.

| 용도 | 아이콘 |
|---|---|
| 검색 | `magnifying-glass` |
| 위치/주소 | `map-pin` |
| 지도/길찾기 | `map` |
| 별점/저장 | `star` (outline=미저장, fill=저장됨 — 이 두 경우만 filled 허용) |
| 검증/인증 배지 | `check-circle` |
| 전화 | `phone` |
| 카드결제 가능 | `credit-card` |
| 도보 거리 | `person-simple-walk` |
| 필터 | `sliders-horizontal` |
| 뒤로가기 | `arrow-left` |
| 닫기 | `x` |
| 하단 내비 (홈/검색/저장/마이) | `house`, `magnifying-glass`, `bookmark-simple`, `user-circle` |

---

## 7. 컴포넌트 스펙 (PRD 7.2 기반 구체화)

### 7.1 맛집 카드 (Restaurant Card)
- 구조: 썸네일(`aspect-[4/3]`, `rounded-t-2xl`) → 상호명(`font-bold text-lg`) + 카테고리 태그 → 평점 배지 + 리뷰 수 + 현지인 비율 아이콘 → 영업상태 배지 → 도보거리/카드결제 아이콘 행.
- 배경 `bg-white`, `shadow-sm`, hover 시 `shadow-md` + `scale-[1.01]`.
- 그리드: 모바일 1열, `sm:` 2열, `lg:` 3열, `xl:` 4열 (`gap-4 md:gap-6`).

### 7.2 영업 상태 배지
- 영업중: `bg-status-open/10 text-status-open` + `check-circle` 아이콘 + "영업중" 텍스트.
- 휴무: `bg-status-closed/10 text-status-closed` + `x-circle` + "휴무".
- 재료소진: `bg-status-soldout/10 text-status-soldout` + `warning-circle` + "재료소진".
- pill 형태(`rounded-full px-3 py-1 text-xs font-medium`), 색만으로 구분하지 않고 항상 텍스트 동반.

### 7.3 검증 리뷰 요약 태그
- `bg-brand-peach text-brand-navy-dark rounded-full px-3 py-1 text-xs font-medium` + `check-circle` 아이콘.
- 예: "현지인 방문 다수", "불친절 후기 없음", "협찬 리뷰 3건 필터링됨".

### 7.4 백업 플랜 CTA
- 조건: 휴무/재료소진 상태에서만 노출. 그 외 상태에서는 DOM에도 넣지 않음(숨김이 아니라 미노출).
- 위치: 모바일 하단 `sticky bottom-0`, 데스크톱은 상세 페이지 사이드 카드 내.
- 스타일: `bg-brand-coral text-white rounded-xl shadow-lg`, 유일한 코랄 배경 버튼 — 페이지당 이 CTA는 1개만.

### 7.5 빈 상태 (Empty State)
- 아이콘(`magnifying-glass` 또는 상황별) + 담백한 한 줄 설명 + 필터 재설정/검색 버튼.
- 과장된 일러스트 대신 아이콘 + 텍스트로 절제.

### 7.6 필터 바 (검색 결과 화면)
- 신뢰도 필터(평점 3.5+·불친절 후기 제외·현지인 비율·영업중)와 실용정보 필터(카드결제·도보거리·예약가능)를 시각적으로 그룹 분리(§9 `field-grouping`).
- 칩 형태 토글, 선택 시 `bg-brand-navy text-white`, 미선택 `bg-white border border-slate-200 text-slate-700`.

---

## 8. 접근성 / 인터랙션 체크리스트

- 본문 텍스트 대비 ≥4.5:1, 보조 텍스트 ≥3:1 (라이트/다크 각각 확인).
- 터치 타겟 ≥44×44px, 간격 ≥8px.
- 모든 클릭 요소 `cursor-pointer` + hover/focus 상태(`focus-visible:ring-2 ring-brand-navy`) 명시.
- 아이콘 전용 버튼은 `aria-label` 필수 (예: 저장 별표, 뒤로가기).
- 이미지 `alt` 텍스트 실질적으로 작성 (예: "스시 마사 매장 내부 사진"), 장식용은 `alt=""`.
- 폼: 라벨은 placeholder 대체 아님, 에러는 필드 하단에, `aria-live="polite"`로 스크린리더 통지.
- `prefers-reduced-motion` 대응 (§5).

## 9. Anti-Patterns (하지 않는 것)

- 이모지를 구조적 아이콘으로 사용 ❌
- 마켓플레이스식 "호스트/판매자 되기" CTA, 화려한 그라디언트 배지 ❌
- 코랄 강조색을 장식적으로 여러 곳에 남발 ❌
- 회색-on-회색 저대비 본문 텍스트 ❌
- 지도를 모든 화면에 기본 노출 (PRD: 위치 지도는 상세 화면의 백업 플랜에서만, 권한도 그 시점에만 요청) ❌
- 여러 아이콘 스타일(선/채움) 혼용 ❌
- 500ms 넘는 장식성 트랜지션, 자동 캐러셀 ❌

---

## 10. 화면 흐름 & 화면별 적용 (PRD 6절 사이트맵 기준, 7개 화면)

핵심 유저 플로우 (PRD 6.1): `홈 → 검색 결과(필터) → 맛집 상세(영업상태 확인) → [영업중: 예약/리뷰 | 휴무/소진: 지도+백업플랜 CTA → 백업 맛집 상세 → (선택) 저장]`

| # | 화면 | 패턴 적용 | 핵심 컴포넌트 |
|---|---|---|---|
| 1 | **홈** (검색 시작) | Directory/Listing의 "검색이 곧 CTA" — 지도 없음, 키워드/필터 검색바 중심, 최근/인기 검색어 | 검색 입력창, 카테고리 칩 |
| 2 | **검색 결과** | 필터-헤비 그리드 | 필터 바(§7.6), 맛집 카드 그리드(§7.1), 빈 상태(§7.5) |
| 3 | **맛집 상세** | Trust & Authority — 인증 배지·리뷰 요약 전면화 | 영업상태 배지(§7.2), 검증 리뷰 태그(§7.3), 백업 플랜 CTA(§7.4, 조건부), 저장 버튼(별) |
| 4 | **저장한 맛집** | Directory/Listing 그리드 재사용 (로그인 필요) | 맛집 카드 그리드, 빈 상태("아직 저장한 맛집이 없어요") |
| 5 | **로그인** | Trust & Authority — 담백한 폼, 브랜드 신뢰 강조 | 이메일/비밀번호 폼, brand-coral 오버레이 |
| 6 | **회원가입** | 플레이스홀더 — 과도한 장식 없이 "준비 중" 안내 + 로그인 복귀 | 안내 카드, 단일 CTA |
| 7 | **마이페이지** | 모바일: 카드 스택 / 데스크톱(`md:`): 대시보드형 3열 그리드 | 계정 정보 카드, 알림·계정설정·검색통계 카드 |

각 목업은 `design-system/mockups/<screen>.html`에 저장하며, 화면 상단에 다른 6개 화면으로 이동하는 얇은 네비게이션을 공통으로 둔다(프로토타입 탐색용, 실제 앱 정보구조는 아님).

---

## 11. 구현 노트 (html-tailwind 스택)

- Tailwind **CDN** 사용(`cdn.tailwindcss.com`), config는 §2 스니펫 그대로 각 파일 상단에 삽입.
- 컨테이너 쿼리보다 표준 반응형 유틸리티 우선(`sm: md: lg: xl:`) — 목업은 독립 파일이라 컴포넌트 단위 `@container`보다 페이지 단위 브레이크포인트가 더 명확함.
- 카드: `rounded-2xl shadow-sm p-4` 기본, 절대 `rounded-lg`/`shadow-md` 임의 혼용 금지.
- 반응형 이미지: Unsplash 목업 이미지에 `?w=800&q=80` 유지, `loading="lazy"` 필수(히어로 제외).
- 모바일 우선 작성 후 `md:`/`lg:`로 확장.

---

## 12. Known Gaps

- 실제 앱(React, `src/pages/*.jsx`)은 이미 이 토큰들로 구현되어 있음 — 이 문서는 신규 색/폰트를 발명하지 않고 기존 구현을 규격화 + Directory/Listing·Trust&Authority 구조 원칙을 명문화한 것. 목업(§10)은 별도 프로토타입이며 React 소스를 직접 수정하지 않음.
- Pretendard/Phosphor는 실제 Google Fonts DB에 없어 `ui-ux-pro-max` 도구가 자동으로 추천하지 못함 — 수동으로 SSOT 유지.
- 다크모드는 브랜드 `-dark` 변형 토큰만 정의되어 있고, 실제 다크모드 전환 스위치는 프로덕션에 아직 없음(향후 구현 시 이 문서의 `-dark` 값 사용).
