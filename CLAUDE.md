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
