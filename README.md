# Gurume Tabi

일본 여행 맛집 리뷰 플랫폼 Gurume Tabi입니다. `PRD.md`와 [와이어프레임](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39)을 기준으로 시작했고, 이제 맛집 데이터는 **Google Places API로 실제 수집한 데이터**(14개 지역 × 6개 카테고리, 약 1,400여 곳)를 씁니다. 인증도 Supabase Auth로 실제 연동되어 있습니다. 아직 mock인 부분(스크랩·최근 검색어 등)은 아래 "아직 안 된 것" 참고.

## 실행 방법

```bash
npm install
npm run dev
```

로컬 실행에는 `.env`가 필요합니다(`.env.example` 참고):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_EMBED_API_KEY=
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
| 맛집 데이터 | `src/lib/restaurants.js` → Supabase `restaurants`/`reviews_cache` | Google Places API로 수집한 실데이터(가게 정보·평점·사진·리뷰). `src/data/mockRestaurants.js`는 더 이상 안 쓰임(죽은 파일로 남아있음) |
| 데이터 수집 | Supabase Edge Functions (`sync-restaurants` 등) | Flask 백엔드 대신 Edge Function이 Google Places/Translation API를 호출해 DB를 채움 — 아래 "데이터 수집" 절 참고 |
| 지도 | Google Maps Embed API | 상세 페이지 위치 지도 |

> Supabase는 **인증 + 맛집 데이터 둘 다 실제 연동**되어 있습니다: 프로젝트(`aeipftjmlikejemppxii`)에 `profiles`·`restaurants`·`reviews_cache`·`scraps`·`search_history` 테이블이 실제로 생성돼 있고(RLS 적용), 프론트가 `@supabase/supabase-js`로 로그인·회원가입·비밀번호 변경 + 맛집/리뷰 조회를 실제 처리합니다. `scraps`/`search_history`는 테이블만 있을 뿐 프론트는 아직 localStorage를 씁니다. Claude Code는 Supabase MCP로 연결되어 있어 대화 중 직접 조회/작업이 가능합니다.

## 데이터 수집

맛집 데이터는 Google Places API를 통해 Supabase Edge Function으로 수집합니다(Flask 백엔드 대신). 핵심 함수:

| 함수 | 역할 |
|---|---|
| `sync-restaurants` | Google Places Text Search로 지역×카테고리별 가게 정보·리뷰·사진을 가져와 upsert. 쇼핑몰/건물, 일본 밖(주로 한국 소재 동명 상호) 결과는 자동 제외 |
| `flag-rude-reviews` | 리뷰 중 불친절 관련 부정 리뷰(별점 2점 이하 + 키워드)가 있는 가게를 표시 |
| `fill-walk-minutes` | 가까운 역까지 도보 거리 계산(오키나와는 철도가 없어 제외) |
| `translate-restaurant-names` | 기존 데이터 중 한글이 아닌 이름을 보정하는 백필 함수 |

수집 범위는 14개 지역(도쿄/오사카/후쿠오카/나고야/삿포로/오키나와/다카마쓰/마쓰야마/오카야마/히로시마/시즈오카/요나고/기타큐슈/나가사키) × 6개 카테고리(스시/라멘/우동/오코노미야키/돈카츠/타코야키)이며, 월 1회 정도 재수집을 권장합니다(자세한 절차는 `CLAUDE.md` 참고).

## 화면 구성

| 경로 | 화면 | 상태 |
|---|---|---|
| `/` | 홈 — `sushi.mp4` 배경 영상 + 브랜드 오버레이(`bg-brand-navy-dark/35`) 위에 검색창(정중앙, 52px 원형 검색 버튼)과 헤드라인 문구를 한 덩어리로 묶어 60px 위로 올려 배치, 인기 태그(`#오사카` 등). 하단 "이전 서치 결과" 카드 섹션은 최근 검색 기록이 있을 때만 노출(현재는 더미 데이터가 비어 있어 숨김) — 검색 기록이 없을 때 인기 검색어로 대체하는 fallback UI는 코드에 주석으로 보존 | ✅ |
| `/search` | 검색 결과 — 맛집 데이터는 Google Places 실데이터(Supabase `restaurants` 조회). 필터 사이드바는 상단 "필터" 타이틀 + "초기화" 링크, 평점·현지인 비율·영업 상태는 단일 선택 세그먼트(전체/3.0+/3.5+/4.0+ 등), 추가 필터(카드 결제·예약 가능·역에서 도보 10분 이내)는 다중 선택 pill, **음식 종류 20종** 체크박스·내부 스크롤(지역 필터는 삭제됨 — 지역은 검색창으로만 다룸), 하단 "필터 적용하기" 버튼을 눌러야 실제 결과에 반영(draft→applied). 검색 결과는 처음 8개만 보이고 "더 많은 "{검색어}" 맛집 보기" 버튼을 눌러야 더 로드됨. 정렬(평점 높은 순·현지인 비율 높은 순·리뷰 많은 순) 드롭다운과 그리드/리스트 보기 토글은 검색 여부와 무관하게 항상 노출. 카드에 `#지역 #음식종류` 해시태그, 그리드 카드는 hover 시 사진 여러 장(최대 5장)을 화살표로 넘겨보는 캐러셀 지원. 사진이 없는 가게는 `#f9f8fc` 배경 + `noImage.png` 아이콘 | ✅ 실데이터 |
| `/place/:id` | 맛집 상세 — 히어로 이미지(사진 없으면 `defaultHero.png` 대체) 위로 가게 이름 표시, 뒤로가기 버튼. 콘텐츠 시트에 평점·현지인 비율·영업 상태 배지 + 해시태그. 위치 지도는 **Google Maps Embed API**로 실제 표시되고, "구글 지도" 버튼은 `place_id` 기반으로 정확한 가게 페이지로 연결됨(단, "리뷰" 탭까지 자동 진입은 안 되고 개요 탭에서 열림 — Places API가 리뷰탭 직행에 필요한 CID를 안 줌). 오른쪽 사이드바는 가게정보 → 지도 → ⭐저장하기 버튼 → "구글 지도"/"근처 백업 플랜" 버튼 → 표기 원칙. 백업 플랜은 같은 지역+같은 음식종류 중 실제 거리(위경도)가 가장 가까운 곳을 추천. 리뷰는 Google 실제 리뷰(최대 5개)이고, 리뷰 카드를 클릭하면 새 탭으로 그 가게의 구글맵 페이지가 열림. 리뷰 작성자 이름 중 한국 실명으로 추정되는 경우 일부 마스킹 처리(`유수아` → `유수○`) | ✅ 실데이터 |
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
- **검색 결과 필터**: 실제 Google Places 데이터에 대해 동작(평점, 현지인 비율, 영업상태, 카드결제, 도보거리, 예약가능, 음식 종류) — 평점·현지인 비율·영업 상태는 단일 선택 세그먼트, 나머지는 다중 선택. 사이드바에서 고른 값은 "필터 적용하기"를 눌러야 실제 결과에 반영되고, "초기화"는 즉시 반영됨. 광고 의심(불친절) 리뷰 제외는 토글 없이 항상 적용되는 기본 동작(Google 리뷰 중 별점 2점 이하 + 불친절 키워드가 있으면 해당 가게 자체가 결과에서 빠짐)
  - **지역 필터는 삭제됨** — 검색어(자연어)와 지역 필터가 동시에 있으면 AND 조건이 되어 결과가 뒤엉키는 문제가 있어서, 지역은 이제 검색창 하나로만 다룸(예: "오사카 라멘")
  - 검색어의 일본어 음차 표기 흔들림(예: "오코노미야키"/"오꼬노미야끼", "타코야키"/"타코야끼")을 `src/utils/searchTerms.js`의 `normalizeJapaneseTranscription`으로 정규화해 매칭 — 평음·경음·격음 표기 차이를 흡수
  - 검색창(`SearchAutocompleteInput` 컴포넌트, 홈·검색·헤더 공용)에 입력 시 `suggestSearchTerms`가 `REGIONS`+`FOOD_TYPES`를 함께 검색해 지역·음식 종류를 드롭다운으로 추천(예: "오"만 쳐도 "오사카"와 "오코노미야키"가 같이 나옴). ↓/↑로 추천 항목을 순환 하이라이트(굵게 표시)하고 Enter로 선택, 하이라이트 없이 Enter를 누르면 입력한 텍스트로 그대로 검색, Esc로 드롭다운 닫기. 텍스트가 있을 때는 돋보기 아이콘 왼쪽에 X 지우기 버튼이 나타남
  - 정렬 드롭다운·그리드/리스트 토글은 검색 여부와 무관하게 항상 노출되고, 정렬 드롭다운은 열려 있을 때/포커스 시 보라색(`#9993e2`) 1px 테두리로 강조됨
  - 결과는 처음 8개만 보이고 "더 많은 맛집 보기" 버튼으로 8개씩 더 로드(무한스크롤 아님, 버튼 클릭식)
- **저장 기능**: 맛집 상세·검색 결과 카드(그리드·리스트 공통)의 ⭐ 버튼 → 비로그인 시 `/login`으로 이동, 로그인 상태면 `scrapIds`에 추가/제거(localStorage에 유지) → 마이페이지·스크랩 화면에 반영. 원형 배경 없이 별 아이콘만 있고, 별 아이콘 자체에 hover했을 때만 보라색(`brand-coral`) 테두리가 나타남(카드 썸네일에 hover하는 것과는 무관)
- **로그인 보호**: `/mypage`는 `ProtectedRoute` 컴포넌트로 감싸져 있어 비로그인 접근 시 `/login`으로 리다이렉트, 로그인 후 원래 경로로 복귀
- **인증**: 로그인·회원가입·로그아웃·비밀번호 변경이 Supabase Auth(`@supabase/supabase-js`)로 실제 동작. 세션은 `onAuthStateChange`로 유지되고, `ProtectedRoute`는 초기 세션 로딩 중에는 리다이렉트하지 않음. 비밀번호 변경은 마이페이지에서 현재 비밀번호로 재인증한 뒤에만 처리됨
- **홈 검색창 포커스 애니메이션**: 커서를 두면 브랜드 보라(navy)·로고 벚꽃 분홍 2색 `conic-gradient`가 4px 두께로 회전하는 보더가 나타남(`index.css`의 `.gradient-border-input`)
- **마이페이지 프로필 관리**: 닉네임과 프로필 사진을 `NicknameModal`에서 수정 가능. 닉네임은 `AuthContext.updateNickname`을 통해 Supabase `profiles.nickname`에 실제로 저장됨. 사진은 jpg/png/webp·500KB 이하만 허용, `FileReader`로 base64 변환 후 `AuthContext.updateAvatar`를 통해 계정별 `localStorage` 키(`gurume_avatar_${user.id}`)에 저장(실제 파일 업로드/스토리지 없음)
- **Footer**: `src/components/Footer.jsx` 공용 컴포넌트가 "Copyright(c)2026 GurumeTabi. All rights reserved." 문구를 4개 화면(홈·검색·스크랩·마이페이지) 하단에 표시. 화면마다 색상·정렬·여백만 다르게 적용(홈은 흰색 70% 투명도, 검색은 회색 `#999`, 스크랩·마이페이지는 흰색). 스크랩·검색 결과는 콘텐츠가 짧아도 `mt-auto`로 항상 화면 하단에 붙음
- **스크롤 안정화**: `/search`·`/scrap`·`/mypage` 모두 페이지 자체는 `h-screen overflow-hidden`이고 콘텐츠 영역만 `overflow-y-scroll`(`pretty-scroll` 커스텀 스크롤바)로 감싸, 콘텐츠 높이 변화로 카드 폭이 흔들리거나 스크롤바가 나타났다 사라지는 현상을 방지함

## 아직 안 된 것 (다음 단계)

- **네이버 블로그 리뷰**: 여전히 mock/미연동 — 리뷰는 Google 리뷰만 실데이터이고, PRD가 원래 계획했던 "네이버+구글 교차검증"의 네이버 쪽은 아직 없음
- **광고성 리뷰 LLM 판별**: Google 리뷰는 애초에 "광고 판별" 대상이 아니라서(`is_ad_filtered`는 항상 `false`) 이 부분 자체가 아직 의미 없음 — 네이버 리뷰 연동 시 다시 필요해짐
- 구글 소셜 로그인
- 스크랩(`scrapIds`)·최근 검색어(`search_history`)는 테이블만 있고 여전히 프론트는 localStorage/더미 데이터 사용
- 프로필 사진 실제 업로드/스토리지 연동(Supabase Storage) — 지금은 base64로 `localStorage`에만 저장
- "역에서 도보 10분 이내" 필터: `walk_minutes`가 아직 안 채워진 지역이 있을 수 있음(`fill-walk-minutes` 재실행 필요), 오키나와는 구조적으로 영구히 비워둠
- 데이터 정합성: 국가 필터(일본 밖 결과 제외)가 2026-08-15부터 적용됨 — 그 이전 수집분에 유사 오염이 남아있을 수 있어 전체 재수집 예정

## 디자인 시스템

`ui-ux-pro-max` 스킬로 생성한 문서/목업이 `design-system/`에 있습니다.

- `design-system/MASTER.md` — 컬러·타이포·여백·컴포넌트·모션·접근성 토큰 SSOT. 업종 일반 추천(비비드 마켓플레이스 톤) 대신 페르소나 워크시트의 신뢰/안심형 톤을 우선 반영
- `design-system/mockups/*.html` — 7개 화면(홈·검색결과·맛집상세·스크랩·로그인·회원가입·마이페이지) standalone HTML+Tailwind CDN 목업. 실제 React 소스와는 별도의 프로토타입이며, React 화면들도 이후 대화에서 같은 톤으로 세부 조정됨

## 참고 문서

- `./PRD.md` — 전체 기획 문서 (문제정의 → 시장 → MoSCoW → 사이트맵 → DB 설계 → 기술스택 → KPI 등)
- [와이어프레임 아티팩트](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39) — 모바일/데스크톱 화면 + DB 설계도 + 시스템 아키텍처
- Supabase 프로젝트: https://aeipftjmlikejemppxii.supabase.co — Claude Code MCP로 연결됨(`claude mcp list`에서 `supabase` 확인 가능). 등록 명령어는 `mcp-server-supabase --project-ref=aeipftjmlikejemppxii`(전역 설치된 `@supabase/mcp-server-supabase` 바이너리 직접 사용, `npx`는 Windows PowerShell에서 `claude mcp add`의 `--` 뒤 옵션 전달이 깨지는 문제가 있어 우회함)
