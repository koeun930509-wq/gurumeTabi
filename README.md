# Gurume Tabi (프론트엔드 뼈대)

일본 여행 맛집 리뷰 플랫폼 Gurume Tabi의 **뼈대(스켈레톤) 프로젝트**입니다. `PRD.md`(상위 폴더)와 [와이어프레임](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39)을 기준으로, 실제 백엔드 연동 없이 **가짜 데이터**로 화면 흐름만 먼저 구현했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test        # Vitest — 전체 테스트 1회 실행
npm run lint     # oxlint
```

## 기술 스택 (현재 구현된 범위)

| 구분 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | React 19 + Vite | `npm create vite -- --template react`로 생성 |
| 스타일링 | Tailwind CSS v4 (`@tailwindcss/vite`, `src/index.css`의 `@theme`로 설정) | 디자인 시스템 색상: 주색 `#6D28D9`(brand-navy) · 강조색 `#A855F7`(brand-coral) · 보조색 `#EDE4FB`(brand-peach). 폰트 크기 스케일도 기본값 대비 상향 조정됨 |
| 라우팅 | react-router-dom | `/`, `/search`, `/place/:id`, `/login`, `/signup`, `/scrap`, `/mypage`(로그인 필요, `ProtectedRoute`) |
| 인증/저장 상태 | `AuthContext` + Supabase Auth (`@supabase/supabase-js`) | 로그인·회원가입·로그아웃·비밀번호 변경이 실제 Supabase Auth로 동작. 스크랩(`scrapIds`)은 여전히 localStorage |
| 데이터 | `src/data/mockRestaurants.js` | 와이어프레임 예시 맛집(스시 마사 등) + 네이버/구글 리뷰 mock |

> 백엔드(Flask), 네이버 블로그·구글 Places API는 **아직 연동 전**입니다 — 맛집 데이터는 여전히 로컬 mock 데이터(`mockRestaurants.js`)로 흉내만 냅니다. Supabase는 **인증만 실제 연동**되어 있습니다: 프로젝트(`aeipftjmlikejemppxii`)에 `profiles`·`restaurants`·`reviews_cache`·`scraps`·`search_history` 테이블이 실제로 생성돼 있고(RLS 적용), 프론트가 `@supabase/supabase-js`로 로그인·회원가입·비밀번호 변경을 실제 처리합니다. `restaurants`/`scraps`/`search_history`는 테이블만 있을 뿐 아직 프론트에서 읽고 쓰지 않습니다. Claude Code는 Supabase MCP(`claude mcp add supabase`, full access)로 연결되어 있어 대화 중 직접 조회/작업이 가능합니다.

## 화면 구성

| 경로 | 화면 | 상태 |
|---|---|---|
| `/` | 홈 — `sushi.mp4` 배경 영상 + 브랜드 오버레이(`bg-brand-navy-dark/35`) 위에 검색창(정중앙, 52px 원형 검색 버튼)과 헤드라인 문구를 한 덩어리로 묶어 60px 위로 올려 배치, 인기 태그(`#오사카` 등). 하단 "이전 서치 결과" 카드 섹션은 최근 검색 기록이 있을 때만 노출(현재는 더미 데이터가 비어 있어 숨김) — 검색 기록이 없을 때 인기 검색어로 대체하는 fallback UI는 코드에 주석으로 보존 | ✅ |
| `/search` | 검색 결과 — 필터(신뢰도 4종 + 여행자 실용정보 3종 + **음식 종류 20종**·**지역 7종**, 둘 다 체크박스·고정 높이(4줄 노출) 내부 스크롤), 맛집 카드 그리드/리스트. 정렬(추천순·평점순·현지인비율순) 드롭다운과 그리드/리스트 보기 토글(전환 시 코랄색 배경이 슬라이드하는 애니메이션)은 검색 여부와 무관하게 항상 노출. 검색 input은 검색을 실행한 뒤에만 정렬 드롭다운 옆에 나타나고, 검색 전에는 화면 중앙의 큰 검색창만 노출 — 두 검색창 모두 텍스트가 있을 때 돋보기 아이콘 왼쪽에 X(지우기) 버튼이 나타남. 카드에 `#지역 #음식종류` 해시태그 노출(그리드·리스트 공통), 카드 썸네일은 hover 시 프레임 안에서 서서히 확대됨. 리스트 뷰 썸네일은 카드 상/하/좌 여백 없이 꽉 차게(150px 폭, 카드 높이에 맞춰 늘어남) | ✅ 검색어 없으면 안내 문구만 표시(전체 목록 노출 안 함) |
| `/place/:id` | 맛집 상세 — 히어로 이미지에 어두운 오버레이(30%) 위로 가게 이름을 흰 글씨로 정중앙 표시, 뒤로가기 버튼. 아래 흰 콘텐츠 시트(둥근 상단)에 지역/음식 종류 해시태그(`#오사카` `#오코노미야키` 등) + 현지인/불친절 태그. 오른쪽 사이드바는 가게정보 → 지도 → ⭐저장하기 버튼 → "구글 지도"/"근처 백업 플랜" 버튼(테두리만 있는 스타일, 50/50 분할) → 표기 원칙. 왼쪽 리뷰 카드는 hover 시 출처별 색(네이버=초록, 구글=보라) 테두리+배경 10%로 강조 | ✅ |
| `/login` | 로그인 — `loginBg.png` 배경(블러 없이 선명하게) + 브랜드 오버레이, 불투명 폼 카드, 로고 이미지. 이메일/비밀번호 폼, Supabase Auth로 실제 로그인 검증, 로그인 성공 시 원래 접근하려던 화면으로 복귀 | ✅ 구글 로그인은 추후 도입 예정 |
| `/signup` | 회원가입 — 로그인과 동일한 배경(블러 없음)/오버레이 스타일. 이메일/비밀번호 폼으로 Supabase Auth 실제 가입 처리(이 프로젝트는 이메일 확인이 꺼져 있어 가입 즉시 로그인됨) | ✅ |
| `/scrap` | 스크랩 — `ProtectedRoute`로 로그인 필요. 타이틀 옆에 "총 N개" 카운트 표시. `/search`와 동일한 `h-screen` + 내부 `overflow-y-scroll` 레이아웃(스크롤바 항상 표시)이고, 데스크톱 계정 아이콘(`AccountActions`)은 콘텐츠 위에 절대 위치로 겹쳐서 로고와 같은 위치·크기로 고정. 콘텐츠가 짧아도 Footer가 화면 하단에 붙음(`mt-auto`). 카드 UI는 `/search`와 동일한 `SearchResultGridCard` 재사용. 빈 상태는 배경 없이 별 아이콘 배지 + 안내문 + "맛집 검색하러 가기" 버튼. 반응형 그리드(모바일 1열~xl 4열). `AuthContext`의 `scrapIds` 기본값이 데모용으로 3곳(스시 마사·이치란 오사카·미즈노) 채워져 있어 첫 방문에도 빈 화면이 아님 | ✅ |
| `/mypage` | 마이페이지 — `ProtectedRoute`로 로그인 필요. 모바일은 카드 스택형, PC(`md` 이상)는 대시보드형(계정 정보 + 알림/계정설정/검색통계 3열 + 이용약관) — `/scrap`와 동일하게 `h-screen`+내부 스크롤 레이아웃이며 계정 아이콘도 콘텐츠 위 절대 위치로 겹쳐 배치. 모바일·PC 모두 "스크랩" 개수를 누르면 `/scrap`로 이동. "프로필 수정"에서 닉네임과 프로필 사진(jpg/png/webp, 500KB 이하, base64로 `localStorage`에 저장) 변경 가능. 비밀번호 변경·이용약관·개인정보처리방침·최근 검색어는 전부 dim 오버레이 위 모달로 노출(더미 콘텐츠). 회원 탈퇴는 `window.confirm` 확인 후 처리 | ✅ 전부 mock |

`/scrap`, `/mypage`의 `Sidebar` 상단 로고는 `Header`(홈·검색)와 완전히 동일한 여백·크기(`px-4 sm:px-6 py-6`, 높이 48px)로 통일되어, 페이지를 이동해도 로고 위치가 흔들리지 않음.

**공통 브랜드 요소**: 헤더·로그인 화면에 `logo.png`(후지산+벚꽃+그릭 심볼 + "Gurume Tabi" 워드마크) 적용.

## 주요 UI 동작

- **헤더(데스크톱)**: 검색/스크랩 맛집/마이페이지가 인라인 노출
- **헤더(모바일, `md` 미만)**: 로고 + 프로필 아바타 + 햄버거(☰) 아이콘(28px)만 노출. 햄버거를 누르면 아바타가 사라지고 X로 바뀌며, 드롭다운 메뉴가 열림 — 검색/스크랩 맛집/마이페이지 각 항목에 아이콘이 붙고 현재 화면은 연보라 배경으로 전체 행이 하이라이트됨. 로그아웃(또는 비로그인 시 로그인)은 헤더 바에서 빠지고 드롭다운 맨 아래에 항상 연보라 배경으로 고정된 행으로 노출
- **로그인 상태**: 로그인 시 `AccountActions` 공용 컴포넌트(`src/components/AccountActions.jsx`)가 44px 원형 프로필 아바타(클릭 시 `/mypage`)와 로그아웃 아이콘 버튼을 보여줌, 비로그인 시 로그인 아이콘 링크로 대체. `showLogout={false}` prop으로 로그아웃 아이콘만 숨길 수 있음(모바일 헤더 닫힘 상태에서 사용). 헤더뿐 아니라 `/mypage`·`/scrap`에서도 콘텐츠 위에 절대 위치로 겹쳐서 동일하게 재사용됨
- **검색 결과 필터**: 실제로 mock 데이터에 대해 동작(평점, 리뷰 품질, 현지인 비율, 영업상태, 카드결제, 도보거리, 예약가능, 음식 종류, **지역**)
  - 지역 필터는 `mockRestaurants`의 명시적 `region` 필드로 매칭(도쿄·오사카·후쿠오카·나고야·삿포로·오키나와·기타). 지역을 직접 선택하면 검색어에 남아있는 지역명 토큰은 매칭에서 제외되어, 필터가 검색어보다 우선 적용됨
  - 검색어의 일본어 음차 표기 흔들림(예: "오코노미야키"/"오꼬노미야끼", "타코야키"/"타코야끼")을 `src/utils/searchTerms.js`의 `normalizeJapaneseTranscription`으로 정규화해 매칭 — 평음·경음·격음 표기 차이를 흡수
  - 검색창(`SearchAutocompleteInput` 컴포넌트, 홈·검색·헤더 공용)에 입력 시 `suggestSearchTerms`가 `REGIONS`+`FOOD_TYPES`를 함께 검색해 지역·음식 종류를 드롭다운으로 추천(예: "오"만 쳐도 "오사카"와 "오코노미야키"가 같이 나옴). ↓/↑로 추천 항목을 순환 하이라이트(굵게 표시)하고 Enter로 선택, 하이라이트 없이 Enter를 누르면 입력한 텍스트로 그대로 검색, Esc로 드롭다운 닫기. 텍스트가 있을 때는 돋보기 아이콘 왼쪽에 X 지우기 버튼이 나타남
  - 정렬 드롭다운·그리드/리스트 토글은 검색 여부와 무관하게 항상 노출되고, 정렬 드롭다운은 열려 있을 때/포커스 시 보라색(`#9993e2`) 1px 테두리로 강조됨
- **저장 기능**: 맛집 상세·검색 결과 카드(그리드·리스트 공통)의 ⭐ 버튼 → 비로그인 시 `/login`으로 이동, 로그인 상태면 `scrapIds`에 추가/제거(localStorage에 유지) → 마이페이지·스크랩 화면에 반영. hover 시 별 아이콘 자체에 보라색(`brand-coral`) 테두리가 나타남
- **로그인 보호**: `/mypage`는 `ProtectedRoute` 컴포넌트로 감싸져 있어 비로그인 접근 시 `/login`으로 리다이렉트, 로그인 후 원래 경로로 복귀
- **인증**: 로그인·회원가입·로그아웃·비밀번호 변경이 Supabase Auth(`@supabase/supabase-js`)로 실제 동작. 세션은 `onAuthStateChange`로 유지되고, `ProtectedRoute`는 초기 세션 로딩 중에는 리다이렉트하지 않음. 비밀번호 변경은 마이페이지에서 현재 비밀번호로 재인증한 뒤에만 처리됨
- **홈 검색창 포커스 애니메이션**: 커서를 두면 브랜드 보라(navy)·로고 벚꽃 분홍 2색 `conic-gradient`가 4px 두께로 회전하는 보더가 나타남(`index.css`의 `.gradient-border-input`)
- **마이페이지 프로필 관리**: 닉네임과 프로필 사진을 `NicknameModal`에서 수정 가능. 닉네임은 `AuthContext.updateNickname`을 통해 Supabase `profiles.nickname`에 실제로 저장됨. 사진은 jpg/png/webp·500KB 이하만 허용, `FileReader`로 base64 변환 후 `AuthContext.updateAvatar`를 통해 계정별 `localStorage` 키(`gurume_avatar_${user.id}`)에 저장(실제 파일 업로드/스토리지 없음)
- **Footer**: `src/components/Footer.jsx` 공용 컴포넌트가 "Copyright(c)2026 GurumeTabi. All rights reserved." 문구를 4개 화면(홈·검색·스크랩·마이페이지) 하단에 표시. 화면마다 색상·정렬·여백만 다르게 적용(홈은 흰색 70% 투명도, 검색은 회색 `#999`, 스크랩·마이페이지는 흰색). 스크랩·검색 결과는 콘텐츠가 짧아도 `mt-auto`로 항상 화면 하단에 붙음
- **스크롤 안정화**: `/search`·`/scrap`·`/mypage` 모두 페이지 자체는 `h-screen overflow-hidden`이고 콘텐츠 영역만 `overflow-y-scroll`(`pretty-scroll` 커스텀 스크롤바)로 감싸, 콘텐츠 높이 변화로 카드 폭이 흔들리거나 스크롤바가 나타났다 사라지는 현상을 방지함

## 아직 안 된 것 (다음 단계)

- Supabase 연동: DB 테이블(`profiles` · `restaurants` · `reviews_cache` · `scraps` · `search_history`) 실제 생성 및 RLS 적용 완료, 프론트에서 `@supabase/supabase-js`로 **인증만** 실제 연동됨(로그인·회원가입·로그아웃·비밀번호 변경·닉네임). `restaurants`/`scraps`/`search_history`는 테이블만 있을 뿐 프론트에서 아직 읽고 쓰지 않음(맛집 데이터는 여전히 mock, 스크랩은 여전히 localStorage)
- Flask 백엔드: 네이버 블로그 검색 API, 구글 Places API 호출 및 리뷰 LLM 협찬 필터링 로직
- 구글 소셜 로그인
- 실제 위치 기반 백업 플랜 로직(현재는 mock 데이터 중 영업중인 첫 번째 맛집을 고정으로 보여줌)
- CLAUDE.md 작성 후 화면별 실제 개발 착수
- 프로필 사진 실제 업로드/스토리지 연동(Supabase Storage) — 지금은 base64로 `localStorage`에만 저장
- 최근 검색어 실제 기록·저장 및 클릭 시 재검색 연동 — 지금은 마이페이지·홈 화면 모두 더미 데이터/주석 처리된 UI만 존재 (`search_history` 테이블 설계는 `PRD.md` 8절 참고)

## 디자인 시스템

`ui-ux-pro-max` 스킬로 생성한 문서/목업이 `design-system/`에 있습니다.

- `design-system/MASTER.md` — 컬러·타이포·여백·컴포넌트·모션·접근성 토큰 SSOT. 업종 일반 추천(비비드 마켓플레이스 톤) 대신 페르소나 워크시트의 신뢰/안심형 톤을 우선 반영
- `design-system/mockups/*.html` — 7개 화면(홈·검색결과·맛집상세·스크랩·로그인·회원가입·마이페이지) standalone HTML+Tailwind CDN 목업. 실제 React 소스와는 별도의 프로토타입이며, React 화면들도 이후 대화에서 같은 톤으로 세부 조정됨

## 참고 문서

- `./PRD.md` — 전체 기획 문서 (문제정의 → 시장 → MoSCoW → 사이트맵 → DB 설계 → 기술스택 → KPI 등)
- [와이어프레임 아티팩트](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39) — 모바일/데스크톱 화면 + DB 설계도 + 시스템 아키텍처
- Supabase 프로젝트: https://aeipftjmlikejemppxii.supabase.co — Claude Code MCP로 연결됨(`claude mcp list`에서 `supabase` 확인 가능). 등록 명령어는 `mcp-server-supabase --project-ref=aeipftjmlikejemppxii`(전역 설치된 `@supabase/mcp-server-supabase` 바이너리 직접 사용, `npx`는 Windows PowerShell에서 `claude mcp add`의 `--` 뒤 옵션 전달이 깨지는 문제가 있어 우회함)
