# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

## 프로젝트

Gurume Tabi (구루메 타비) — 일본 여행 맛집 리뷰 플랫폼. 맛집 데이터는 여전히 100% 가짜 데이터(`src/data/mockRestaurants.js`)를 쓰지만, 인증은 Supabase Auth로 실제 연동되어 있습니다(`AuthContext.login(email, password)`가 `src/lib/supabaseClient.js`를 통해 실제 로그인 검증을 수행하고, 회원가입·비밀번호 변경도 실제로 동작 — 아래 인증 관련 항목 참고). 스크랩·검색 기록 등은 아직 localStorage 기반. 전체 제품 기획은 `../PRD.md` 참고.

## 명령어

```bash
npm run dev      # vite 개발 서버
npm run build    # vite 빌드
npm run lint      # oxlint (ESLint 아님 — 설정은 .oxlintrc.json에 있음)
npm run preview  # 프로덕션 빌드 프리뷰
npm test         # vitest run (Vitest + React Testing Library, jsdom 환경)
```

테스트 파일은 테스트 대상 코드 옆에 위치(`*.test.jsx`). Vitest 설정은 `vite.config.js` 안에 인라인(`test: {...}`)으로 되어 있고, 셋업 파일은 `src/setupTests.js`.

## 스타일링 — Tailwind v4, config 파일 없음

테마는 `src/index.css`의 `@theme{}` 블록 안에 있습니다 — **`tailwind.config.js`는 없습니다**. 알아둘 커스텀 토큰:

- 브랜드 컬러: `--color-brand-navy` (#6D28D9), `--color-brand-coral` (#A855F7), `--color-brand-peach` (#EDE4FB), 각각 `-dark` 변형 있음. 여기에 `--color-status-open/closed/soldout` 추가. 이건 Tailwind 기본값이 아니므로 `bg-brand-coral`, `text-brand-navy` 등으로 사용.
- 폰트 크기 스케일은 Tailwind 기본값이 아니라 **오버라이드**되어 있음: `text-xs`부터 `text-2xl`까지 한 단계씩 위로 밀려 있음(예: `text-base` = 1.125rem, 1rem 아님). 픽셀 값을 추론할 때 Tailwind 기본 타입 스케일을 가정하지 말고, 먼저 `src/index.css`의 `@theme` 블록을 확인할 것.
- Body에는 전역 그라디언트 배경 + `background-attachment: fixed`가 Tailwind 유틸리티가 아니라 `index.css`에 직접 설정되어 있음.
- 대형 미디어(영상/풀블리드 히어로 이미지, 로고)는 `public/`에 있고 `src/assets`에서 import하는 대신 절대경로(`/sushi.mp4`, `/logo.png`, `/loginBg.png`)로 참조함 — Vite가 이걸 번들링/해싱하지 않게 하려는 의도적 선택. 상대적으로 작은 장식용 이미지(예: `src/assets/hero.png`)는 여전히 일반적인 `import x from '../assets/...'` 패턴을 씀. 어느 페이지가 어떤 방식을 쓰는지 확인 없이 이 불일치를 한쪽으로 "통일"하려 하지 말 것.

## 코드 스타일

- 싱글 쿼트, 세미콜론 없음, 함수형 컴포넌트만 사용
- 상태 관리: React Context만 사용(`src/context/AuthContext.jsx`), Redux/Zustand 없음
- 커스텀 훅 패턴: `useAuth()`가 `useContext(AuthContext)`를 감싸며, Provider와 같은 파일에 정의됨. `AuthContext` 자체도 export됨(테스트에서 `AuthProvider`의 localStorage 로직을 거치지 않고 mock `AuthContext.Provider`로 컴포넌트를 감쌀 수 있도록) — 이로 인해 oxlint의 `only-export-components` 경고가 뜨는데, 여기서는 의도된 것이고 문제없음
- Tailwind 클래스는 JSX에 직접 인라인; `navLinkClass(isActive)` 같은 헬퍼 함수가 템플릿 문자열 클래스 조합을 반환 — `clsx`/`cva` 없음

## 라우팅 & 인증

- 라우트는 `src/App.jsx`에서 `<Routes>/<Route>`로 선언
- `ProtectedRoute`(`src/components/ProtectedRoute.jsx`)가 로그인이 필요한 라우트를 감쌈 — `state={{from: location}}`과 함께 `/login`으로 리다이렉트하고, `LoginPage`는 로그인 성공 후 그 위치로 다시 돌려보냄. `/mypage`와 `/scrap` 둘 다 감싸져 있음
- `/signup`은 Supabase Auth로 실제 회원가입을 처리함 — 이 프로젝트는 이메일 확인(Confirm email)이 꺼져 있어 가입 즉시 로그인 상태가 됨(별도 메일함 확인 불필요)

## 주의할 점 (Gotchas)

- 브랜드명은 이제 어디서나 "Gurume Tabi"임. 예전 중복 뼈대(과거 `../jtaste-pass`에 있던 초안 "J-Taste Pass" 브랜딩)는 삭제됨 — 이 `gurumeTabi` 폴더가 유일한 실제 버전임.
- 앱 코드(프론트) 안에서 실제 백엔드에 연결된 것은 없음 — Flask도, `@supabase/supabase-js` 클라이언트 호출도 없음. 어떤 네트워크 호출도 실제로 동작한다고 가정하지 말 것; 모든 데이터는 `src/data/mockRestaurants.js`와 `localStorage`를 통해 흐름. (단, Claude Code 자체에는 Supabase MCP가 연결되어 있음 — 아래 별도 항목 참고. 이건 대화 중 Claude가 프로젝트를 직접 조회/조작할 수 있는 채널이고, 앱 런타임 코드와는 무관함.)
- **Supabase MCP 연결됨**: 프로젝트 `aeipftjmlikejemppxii`(https://aeipftjmlikejemppxii.supabase.co)에 `claude mcp add supabase`로 연결되어 있음(full access, `claude mcp list`에서 `supabase` 확인 가능) — `profiles`/`restaurants`/`scraps`/`reviews_cache`/`search_history` 등 실제 테이블은 PRD.md 8절 스키마 설계대로 생성 완료됨(RLS 적용). `profiles`에는 관리자 구분용 `is_admin`(boolean, 기본 false) 컬럼도 추가했고 관리자 계정 1개를 만들어 `true`로 표시해둠 — 다만 이 플래그를 실제로 검사하는 관리자 화면/로직은 아직 없음. 등록 명령은 `npx`/`-y` 대신 전역 설치한 `mcp-server-supabase` 바이너리를 직접 씀(`npm install -g @supabase/mcp-server-supabase` 후 `claude mcp add supabase -e SUPABASE_ACCESS_TOKEN=... -- mcp-server-supabase --project-ref=aeipftjmlikejemppxii`) — Windows PowerShell에서 `claude mcp add ... -- <cmd> <flags>` 형태로 실행하면 `--` 뒤의 옵션(`-y`든 `--project-ref=...`든 대시로 시작하는 건 전부)이 `claude mcp add` 자체의 옵션으로 잘못 파싱되는 버그가 있었음(Bash/git bash로 실행하면 문제없이 통과됨) — 같은 문제가 재발하면 옵션 없는 명령만 `--` 뒤에 오도록 래퍼 스크립트로 옵션을 감추거나, PowerShell 대신 Bash로 실행할 것.
- 프로젝트 루트에는 관련 없는 한국어 `.docx` 워크시트 파일들과 `drive-download-*.zip`도 있음 — 이건 강의/기획 자료이고 앱 코드가 아니며, gitignore 처리됨(`*.docx`, `drive-download-*.zip`).
- `design-system/MASTER.md` + `design-system/mockups/*.html`은 `ui-ux-pro-max` 스킬로 생성된 별도의 디자인 토큰 레퍼런스 및 standalone HTML 프로토타입임 — 실제 React 앱의 일부가 아니고 어떤 라우트에도 연결되어 있지 않음. `src/pages/`의 실제 페이지들과 혼동하지 말 것; `MASTER.md`는 `src/index.css`에 이미 존재하는 토큰들을 문서화한 것으로 취급하고, 여기서 색상을 동기화해와야 하는 새로운 source of truth로 취급하지 말 것.
- `src/pages/HomePage.jsx.bak`은 리워크 이전 `HomePage.jsx`를 수동으로 백업해둔 스냅샷임(안전망용, 어디서도 import되지 않음) — 복원/diff 요청이 있을 때가 아니면 무시할 것.
- 검색어 매칭용 상수(`FOOD_TYPES`, `REGIONS`)와 일본어 음차 표기 정규화 함수(`normalizeJapaneseTranscription`, "오코노미야키"/"오꼬노미야끼"처럼 평음·경음·격음 표기 차이를 흡수)는 `src/utils/searchTerms.js`에 있음 — `SearchResultsPage.jsx`에 중복 정의하지 말고 여기서 import. 같은 파일의 `suggestSearchTerms`(예전 이름 `suggestFoodTypes`)는 `REGIONS`+`FOOD_TYPES`를 함께 검색하므로, 입력값이 지역명과 음식명 양쪽에 매칭될 수 있음(예: "오" → "오사카"·"오코노미야키"·"오뎅" 등이 한 목록에 같이 뜸) — 음식 종류만 다시 필터링하는 별도 함수를 새로 만들지 말 것.
- `SearchAutocompleteInput.jsx`는 값이 있을 때 마우스 클릭뿐 아니라 키보드(↓/↑로 추천 항목 순환 하이라이트, Enter로 하이라이트된 항목 선택, 하이라이트 없이 Enter면 부모 `<form>`의 기본 submit으로 흘러가게 그대로 둠, Esc로 닫기)도 지원함 — `activeIndex` state로 하이라이트를 관리하며 `value`가 바뀌면 `-1`로 리셋됨. 이 컴포넌트를 쓰는 곳(홈·검색·헤더)마다 옆에 있는 돋보기 아이콘과 별개로, 텍스트가 있을 때 그 아이콘 왼쪽에 X 지우기 버튼을 각 페이지에서 조건부로 렌더링해둠(컴포넌트 자체에는 X 버튼이 없음) — 위치·크기는 페이지마다 옆 아이콘 크기에 비례해서 다르게 잡혀 있으니 통일하려 하지 말 것.
- `SearchAutocompleteInput`(`src/components/SearchAutocompleteInput.jsx`)은 헤더 검색창과 `/search` 페이지의 검색창 둘 다에서 쓰는 공용 컴포넌트임 — 검색 입력 UI/자동완성 동작을 고칠 때 한쪽만 수정하고 다른 쪽을 빠뜨리지 않도록 두 사용처(`Header.jsx`, `SearchResultsPage.jsx`) 모두 확인할 것.
- `AccountActions`(`src/components/AccountActions.jsx`)는 프로필 아바타(44px 원형, 클릭 시 `/mypage`)와 로그아웃 버튼(비로그인 시 로그인 아이콘 링크)을 묶은 공용 컴포넌트. `showLogout` prop(기본 `true`)으로 로그아웃 아이콘만 숨길 수 있음 — `Header.jsx`가 모바일에서 메뉴 닫힘 상태일 때 `showLogout={false}`로 아바타만 보여주고, 로그아웃은 모바일 드롭다운 메뉴 안으로 옮겨서 별도로 렌더링함(아래 헤더 항목 참고). `Header.jsx`(데스크톱 nav), `MyPage.jsx`, `ScrapPage.jsx`에서 재사용됨 — 마크업을 각 파일에 다시 베껴 넣지 말고 이 컴포넌트를 import해서 쓸 것. `MyPage.jsx`/`ScrapPage.jsx`에서는 콘텐츠 영역 위에 `absolute top-0 right-0`로 겹쳐서 배치(아래 스크롤 관련 항목 참고) — 더 이상 타이틀 옆 일반 flow가 아님.
- `Header.jsx`의 모바일(`md` 미만) 헤더: 메뉴 닫힘 상태는 로고+아바타+햄버거(28px, `w-7 h-7`)만 노출. 햄버거를 누르면 아바타가 사라지고 X로 바뀌며, `MOBILE_MENU`(검색/스크랩 맛집/마이페이지, `Sidebar.jsx`의 `MENU`와 동일한 아이콘 세트) 드롭다운이 열림 — 각 항목에 아이콘이 붙고 `active` 일치 시 전체 행이 `bg-brand-peach/40`로 하이라이트(텍스트 색만 바꾸던 이전 방식과 다름). 로그아웃(비로그인 시 로그인)은 드롭다운 맨 아래 `mt-auto` 행으로 항상 고정되고 항상 하이라이트 배경(`bg-brand-peach/30`)이 켜져 있음 — 데스크톱 nav의 로그아웃(항상 `AccountActions` 안에 있음)과는 별개 마크업이니 모바일 메뉴 항목을 고칠 때 데스크톱 쪽과 헷갈리지 말 것.
- `Sidebar.jsx`(`/mypage`, `/scrap` 데스크톱 좌측 메뉴)의 로고는 `Header.jsx`의 로고와 **완전히 동일한** 여백·크기 클래스(`px-4 sm:px-6 py-6`, `h-[43.2px] sm:h-12`)를 씀 — 두 컴포넌트가 별개 파일이라 임의로 하나만 바꾸면 홈/검색(Header) ↔ 마이페이지/스크랩(Sidebar) 이동 시 로고가 위치·크기가 달라져 화면이 흔들리게 됨. 로고 스타일을 고칠 때는 항상 두 파일을 함께 수정할 것.
- `RestaurantCard.jsx`는 삭제됨. `/scrap`(`ScrapPage.jsx`)도 `/search` 결과와 동일한 `SearchResultGridCard`를 그대로 재사용하도록 통일했음 — 카드 UI를 고칠 때 검색 결과와 스크랩 화면에 동시에 반영됨을 염두에 둘 것.
- `SearchResultGridCard.jsx`(그리드)와 `SearchResultCard.jsx`(리스트) 둘 다 `#{restaurant.region} #{restaurant.category}` 해시태그를 표시함 — 한쪽만 고치고 다른 쪽을 빠뜨리지 않을 것. 저장(⭐) 버튼도 두 컴포넌트 모두 실제 `<button>`으로 `toggleScrap`에 연결돼 있고(리스트뷰는 원래 클릭 안 되는 `<span>`이었다가 나중에 버튼으로 바뀜), `cursor-pointer` + hover 시 별 아이콘 자체에 `stroke-brand-coral` 테두리가 나타남(버튼의 원형 배경이 아니라 `IconStar`에 `group-hover:stroke-brand-coral` 클래스를 줌). `SearchResultCard.jsx`는 카드 전체가 `<Link>`라서, 저장 버튼 클릭이 상세 페이지 이동으로 새는 걸 막으려고 `preventDefault`+`stopPropagation`을 씀. `SearchResultCard.jsx`의 썸네일은 카드 상/하/좌 여백 없이 꽉 차게(`self-stretch`, 카드 높이에 맞춰 늘어남) 폭 150px 고정 — 정사각형이 아니라 카드 높이를 그대로 따라가는 세로로 긴 직사각형에 가까움.
- `AuthContext`의 `user` 객체는 `email` 외에 `nickname`(선택), `avatar`(선택, 파일 업로드 결과를 FileReader로 변환한 base64 data URL)를 가질 수 있음. `updateNickname(nickname)` / `updateAvatar(dataUrl)`로 갱신. 아바타 업로드는 `MyPage.jsx`의 `NicknameModal`에서 jpg/png/webp, 500KB 이하로만 제한하고 실제 파일 스토리지 없이 `localStorage`에 그대로 문자열로 저장함 — 큰 이미지를 반복 업로드하면 localStorage 용량 한도에 걸릴 수 있음을 유의.
- `AuthContext`의 `scrapIds` 초기값은 빈 배열이 아니라 `DEMO_SCRAP_IDS`(`sushi-masa`, `ichiran-osaka`, `okonomiyaki-mizuno`) — `localStorage`에 `gurume_scrap_ids` 키가 이미 있으면 그 값이 우선하고, 키가 아예 없는 최초 방문에서만 데모 데이터가 채워짐.
- 인증은 `src/lib/supabaseClient.js`(`import.meta.env.VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, 값은 `.env`에 있고 gitignore 처리됨 — `.env.example`이 템플릿)를 통해 Supabase Auth와 실제로 연동됨. `AuthContext`의 `login(email, password)`/`signup(email, password)`/`logout()`/`changePassword(current, next)`가 전부 `supabase.auth.*` 실제 호출이고, 세션은 `onAuthStateChange`로 유지됨 — `ProtectedRoute`는 초기 세션 로딩 중(`loading === true`)에는 `/login`으로 잘못 리다이렉트하지 않도록 가드함. `updateNickname`은 `profiles.nickname`에 실제로 저장되지만, `updateAvatar`와 스크랩(`scrapIds`)은 여전히 localStorage 전용(아바타는 계정별로 `gurume_avatar_${user.id}` 키 사용). 회원가입 시 `auth.users` insert에 붙은 `handle_new_user` 트리거가 `profiles` 행을 자동 생성함.
- `HomePage.jsx`의 `RECENT` 배열은 현재 빈 배열(`[]`)로 되어 있어 하단 "이전 서치 결과" `<section>` 자체가 렌더링되지 않음(빈 배열이면 `RECENT.length > 0` 조건이 false). 그 안에 있던 인기 검색어(`POPULAR`) fallback 카드 UI는 지우지 않고 JS 블록 주석으로만 보존해뒀으니, 나중에 필요하면 주석만 해제할 것.
- `MyPage.jsx`의 이용약관/개인정보처리방침/비밀번호 변경/닉네임·프로필사진 수정/최근 검색어 모달은 전부 단일 `policyModal` state(문자열 키: `"terms"` `"privacy"` `"password"` `"nickname"` `"recentSearch"` `null`)로 어느 모달이 열려 있는지 관리함. 새 모달을 추가할 때도 별도 boolean state를 만들지 말고 이 패턴(키 문자열 하나 + 각 모달 컴포넌트가 자기 키인지 확인)을 따를 것.
- `Footer`(`src/components/Footer.jsx`)는 "Copyright(c)2026 GurumeTabi. All rights reserved." 문구를 보여주는 공용 컴포넌트로, 폰트 크기(14px)와 문구는 이 파일 하나에서만 관리하고 `className` prop으로 페이지별 색상/여백/정렬만 오버라이드함. 4개 화면(`HomePage`, `SearchResultsPage`, `ScrapPage`, `MyPage`)에 각각 다른 스타일로 배치되어 있음 — 색상은 홈이 `text-white/70`, 검색이 `text-[#999]`, 스크랩·마이페이지가 `text-white`로 서로 다르니 통일하려 하지 말 것. `SearchResultsPage.jsx`·`ScrapPage.jsx`는 `mt-auto`를 줘서, 콘텐츠가 스크롤 안 생길 만큼 짧아도(검색 전/스크랩 적음) Footer가 화면 하단에 붙게 해둠 — `MyPage.jsx`는 콘텐츠가 항상 충분히 길어서 `mt-auto` 없이도 자연스럽게 하단에 위치함.
- Tailwind v4에서 반응형(`md:`) 유틸리티와 비반응형 유틸리티를 같은 속성에 섞어 쓸 때(예: `p-8 pb-0`) JSX 소스 순서가 아니라 Tailwind가 생성한 CSS 소스 순서(반응형 variant가 항상 뒤에 옴)가 우선한다 — `md:p-8`이 있는데 하단 padding만 지우려면 `pb-0`이 아니라 `md:pb-0`처럼 같은 breakpoint 접두사로 오버라이드해야 실제로 적용됨. `ScrapPage.jsx`/`MyPage.jsx`의 Footer 하단 padding 처리에서 이 패턴을 씀(`p-6 pb-0 md:p-8 md:pb-0`).
- `SearchResultsPage.jsx`의 결과 영역(오른쪽, 필터 aside 제외) 스크롤 컨테이너는 `overflow-y-scroll`(auto 아님)로 항상 스크롤바 트랙을 예약해둠 — 그리드/리스트 뷰 전환 시 콘텐츠 높이가 달라져도 스크롤바 유무로 카드 폭이 흔들리지 않게 하기 위함. `.pretty-scroll` 클래스(`src/index.css`)도 트랙 배경을 옅은 흰색(`rgba(255,255,255,0.15)`)으로 채워 스크롤 여부와 무관하게 라인이 항상 보이도록 함. `MyPage.jsx`/`ScrapPage.jsx`도 페이지 전체를 `h-screen overflow-hidden`으로 고정하고 콘텐츠만 이 `overflow-y-scroll pretty-scroll` 패턴을 그대로 씀 — 세 화면 모두 동일한 스크롤 처리 방식.
- **`overflow-y-scroll` 컨테이너 안에 있는 요소에는 음수 `margin-top`을 주지 말 것.** `MyPage.jsx`/`ScrapPage.jsx`에서 콘텐츠를 위로 당기려고 스크롤 박스 안쪽 요소에 `-mt-[...]`를 줬다가, 스크롤 박스의 `scrollTop`은 0 밑으로 못 내려가서 그 요소가 스크롤 박스 top 위쪽(음수 좌표)으로 밀려나 영구히 안 보이고 스크롤로도 못 꺼내오는 버그가 났음(타이틀이 통째로 사라짐). 그래서 두 페이지 모두 계정 아이콘(`AccountActions`)을 스크롤 박스 **밖**, 콘텐츠 컬럼에 `absolute top-0 right-0 z-20`로 겹쳐 배치하는 방식으로 우회함 — 콘텐츠와 계정 아이콘 사이 간격을 좁히고 싶으면 스크롤 박스 안쪽 요소의 음수 margin이 아니라 이 absolute 오버레이의 위치·패딩을 조정할 것.
