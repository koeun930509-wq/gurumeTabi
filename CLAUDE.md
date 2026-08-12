# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

## 프로젝트

Gurume Tabi (구루메 타비) — 일본 여행 맛집 리뷰 플랫폼. 이것은 **프론트엔드 뼈대뿐**입니다: 100% 가짜 데이터(`src/data/mockRestaurants.js`)와 localStorage 기반 가짜 인증(`AuthContext.login(email)`은 어떤 이메일이든 통과시키며 비밀번호 검증·백엔드 없음). 전체 제품 기획은 `../PRD.md` 참고.

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
- `ProtectedRoute`(`src/components/ProtectedRoute.jsx`)가 로그인이 필요한 라우트를 감쌈 — `state={{from: location}}`과 함께 `/login`으로 리다이렉트하고, `LoginPage`는 로그인 성공 후 그 위치로 다시 돌려보냄. `/mypage`와 `/saved` 둘 다 감싸져 있음
- `/signup`은 아직 플레이스홀더 페이지뿐 — 실제 가입 로직 없음

## 주의할 점 (Gotchas)

- 브랜드명은 이제 어디서나 "Gurume Tabi"임. 예전 중복 뼈대(과거 `../jtaste-pass`에 있던 초안 "J-Taste Pass" 브랜딩)는 삭제됨 — 이 `gurumeTabi` 폴더가 유일한 실제 버전임.
- 실제 백엔드에 연결된 것은 없음 — Supabase도, Flask도, API 키도 없음. 어떤 네트워크 호출도 실제로 동작한다고 가정하지 말 것; 모든 데이터는 `src/data/mockRestaurants.js`와 `localStorage`를 통해 흐름.
- 프로젝트 루트에는 관련 없는 한국어 `.docx` 워크시트 파일들과 `drive-download-*.zip`도 있음 — 이건 강의/기획 자료이고 앱 코드가 아니며, gitignore 처리됨(`*.docx`, `drive-download-*.zip`).
- `design-system/MASTER.md` + `design-system/mockups/*.html`은 `ui-ux-pro-max` 스킬로 생성된 별도의 디자인 토큰 레퍼런스 및 standalone HTML 프로토타입임 — 실제 React 앱의 일부가 아니고 어떤 라우트에도 연결되어 있지 않음. `src/pages/`의 실제 페이지들과 혼동하지 말 것; `MASTER.md`는 `src/index.css`에 이미 존재하는 토큰들을 문서화한 것으로 취급하고, 여기서 색상을 동기화해와야 하는 새로운 source of truth로 취급하지 말 것.
- `src/pages/HomePage.jsx.bak`은 리워크 이전 `HomePage.jsx`를 수동으로 백업해둔 스냅샷임(안전망용, 어디서도 import되지 않음) — 복원/diff 요청이 있을 때가 아니면 무시할 것.
- 검색어 매칭용 상수(`FOOD_TYPES`, `REGIONS`)와 일본어 음차 표기 정규화 함수(`normalizeJapaneseTranscription`, "오코노미야키"/"오꼬노미야끼"처럼 평음·경음·격음 표기 차이를 흡수)는 `src/utils/searchTerms.js`에 있음 — `SearchResultsPage.jsx`에 중복 정의하지 말고 여기서 import.
- `SearchAutocompleteInput`(`src/components/SearchAutocompleteInput.jsx`)은 헤더 검색창과 `/search` 페이지의 검색창 둘 다에서 쓰는 공용 컴포넌트임 — 검색 입력 UI/자동완성 동작을 고칠 때 한쪽만 수정하고 다른 쪽을 빠뜨리지 않도록 두 사용처(`Header.jsx`, `SearchResultsPage.jsx`) 모두 확인할 것.
- `AccountActions`(`src/components/AccountActions.jsx`)는 프로필 아바타(44px 원형, 클릭 시 `/mypage`)와 로그아웃 버튼(비로그인 시 로그인 아이콘 링크)을 묶은 공용 컴포넌트. `Header.jsx`(모바일 포함 전체 화면 공통 헤더), `MyPage.jsx`(PC 레이아웃, 타이틀 옆), `SavedPlacesPage.jsx`(PC 레이아웃, 타이틀 옆)에서 재사용됨 — 마크업을 각 파일에 다시 베껴 넣지 말고 이 컴포넌트를 import해서 쓸 것.
- `RestaurantCard.jsx`는 삭제됨. `/saved`(`SavedPlacesPage.jsx`)도 `/search` 결과와 동일한 `SearchResultGridCard`를 그대로 재사용하도록 통일했음 — 카드 UI를 고칠 때 검색 결과와 저장한 맛집 화면에 동시에 반영됨을 염두에 둘 것.
- `AuthContext`의 `user` 객체는 `email` 외에 `nickname`(선택), `avatar`(선택, 파일 업로드 결과를 FileReader로 변환한 base64 data URL)를 가질 수 있음. `updateNickname(nickname)` / `updateAvatar(dataUrl)`로 갱신. 아바타 업로드는 `MyPage.jsx`의 `NicknameModal`에서 jpg/png/webp, 500KB 이하로만 제한하고 실제 파일 스토리지 없이 `localStorage`에 그대로 문자열로 저장함 — 큰 이미지를 반복 업로드하면 localStorage 용량 한도에 걸릴 수 있음을 유의.
- `AuthContext`의 `savedIds` 초기값은 빈 배열이 아니라 `DEMO_SAVED_IDS`(`sushi-masa`, `ichiran-osaka`, `okonomiyaki-mizuno`) — `localStorage`에 `gurume_saved_ids` 키가 이미 있으면 그 값이 우선하고, 키가 아예 없는 최초 방문에서만 데모 데이터가 채워짐.
- `HomePage.jsx`의 `RECENT` 배열은 현재 빈 배열(`[]`)로 되어 있어 하단 "이전 서치 결과" `<section>` 자체가 렌더링되지 않음(빈 배열이면 `RECENT.length > 0` 조건이 false). 그 안에 있던 인기 검색어(`POPULAR`) fallback 카드 UI는 지우지 않고 JS 블록 주석으로만 보존해뒀으니, 나중에 필요하면 주석만 해제할 것.
- `MyPage.jsx`의 이용약관/개인정보처리방침/비밀번호 변경/닉네임·프로필사진 수정/최근 검색어 모달은 전부 단일 `policyModal` state(문자열 키: `"terms"` `"privacy"` `"password"` `"nickname"` `"recentSearch"` `null`)로 어느 모달이 열려 있는지 관리함. 새 모달을 추가할 때도 별도 boolean state를 만들지 말고 이 패턴(키 문자열 하나 + 각 모달 컴포넌트가 자기 키인지 확인)을 따를 것.
- `Footer`(`src/components/Footer.jsx`)는 "Copyright(c)2026 GurumeTabi. All rights reserved." 문구를 보여주는 공용 컴포넌트로, 폰트 크기(14px)와 문구는 이 파일 하나에서만 관리하고 `className` prop으로 페이지별 색상/여백/정렬만 오버라이드함. 4개 화면(`HomePage`, `SearchResultsPage`, `SavedPlacesPage`, `MyPage`)에 각각 다른 스타일로 배치되어 있음 — 색상은 홈이 `text-white/70`, 검색이 `text-[#999]`, 저장한맛집·마이페이지가 `text-white`로 서로 다르니 통일하려 하지 말 것.
- Tailwind v4에서 반응형(`md:`) 유틸리티와 비반응형 유틸리티를 같은 속성에 섞어 쓸 때(예: `p-8 pb-0`) JSX 소스 순서가 아니라 Tailwind가 생성한 CSS 소스 순서(반응형 variant가 항상 뒤에 옴)가 우선한다 — `md:p-8`이 있는데 하단 padding만 지우려면 `pb-0`이 아니라 `md:pb-0`처럼 같은 breakpoint 접두사로 오버라이드해야 실제로 적용됨. `SavedPlacesPage.jsx`/`MyPage.jsx`의 Footer 하단 padding 처리에서 이 패턴을 씀(`p-6 pb-0 md:p-8 md:pb-0`).
- `SearchResultsPage.jsx`의 결과 영역(오른쪽, 필터 aside 제외) 스크롤 컨테이너는 `overflow-y-scroll`(auto 아님)로 항상 스크롤바 트랙을 예약해둠 — 그리드/리스트 뷰 전환 시 콘텐츠 높이가 달라져도 스크롤바 유무로 카드 폭이 흔들리지 않게 하기 위함. `.pretty-scroll` 클래스(`src/index.css`)도 트랙 배경을 옅은 흰색(`rgba(255,255,255,0.15)`)으로 채워 스크롤 여부와 무관하게 라인이 항상 보이도록 함.
