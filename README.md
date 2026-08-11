# Gurume Tabi (프론트엔드 뼈대)

일본 여행 맛집 리뷰 플랫폼 Gurume Tabi의 **뼈대(스켈레톤) 프로젝트**입니다. `PRD.md`(상위 폴더)와 [와이어프레임](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39)을 기준으로, 실제 백엔드 연동 없이 **가짜 데이터**로 화면 흐름만 먼저 구현했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 기술 스택 (현재 구현된 범위)

| 구분 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | React 19 + Vite | `npm create vite -- --template react`로 생성 |
| 스타일링 | Tailwind CSS v4 (`@tailwindcss/vite`, `src/index.css`의 `@theme`로 설정) | 디자인 시스템 색상: 주색 `#6D28D9`(brand-navy) · 강조색 `#A855F7`(brand-coral) · 보조색 `#EDE4FB`(brand-peach). 폰트 크기 스케일도 기본값 대비 상향 조정됨 |
| 라우팅 | react-router-dom | `/`, `/search`, `/place/:id`, `/login`, `/signup`, `/saved`, `/mypage`(로그인 필요, `ProtectedRoute`) |
| 인증/저장 상태 | `AuthContext` (localStorage) | **가짜 로그인** — 이메일만 입력하면 통과, 비밀번호 검증 없음. 실제로는 Supabase Auth로 교체 예정 |
| 데이터 | `src/data/mockRestaurants.js` | 와이어프레임 예시 맛집(스시 마사 등) + 네이버/구글 리뷰 mock |

> 백엔드(Flask), Supabase DB/Auth, 네이버 블로그·구글 Places API는 **아직 연동 전**입니다. 지금은 전부 로컬 mock 데이터와 `localStorage`로 흉내만 냅니다.

## 화면 구성

| 경로 | 화면 | 상태 |
|---|---|---|
| `/` | 홈 — 검색창(정중앙 배치, 헤더/최근검색 사이 공간을 꽉 채움), 인기 태그(`#오사카` 등), 최근 검색 | ✅ |
| `/search` | 검색 결과 — 필터(신뢰도 4종 + 여행자 실용정보 3종), 지역 칩, 맛집 카드 그리드 | ✅ 검색어 없으면 안내 문구만 표시(전체 목록 노출 안 함) |
| `/place/:id` | 맛집 상세 — 사진·평점·영업상태·⭐저장·주소·전화번호, 네이버+구글 리뷰, 휴무/소진 시 지도+백업 플랜 CTA | ✅ |
| `/login` | 로그인 — 이메일/비밀번호 폼(가짜 인증), 로그인 성공 시 원래 접근하려던 화면으로 복귀 | ✅ 구글 로그인은 추후 도입 예정 |
| `/signup` | 회원가입 — 안내 전용 플레이스홀더(실제 가입 로직 미구현) | ✅ |
| `/saved` | 저장한 맛집 — `ProtectedRoute`로 로그인 필요, 화면 상단 타이틀, 반응형 그리드(모바일 1열~xl 4열) | ✅ |
| `/mypage` | 마이페이지 — `ProtectedRoute`로 로그인 필요. 모바일은 카드 스택형, PC(`md` 이상)는 대시보드형(계정 정보 + 알림/계정설정/검색통계 3열 + 이용약관) | ✅ 전부 mock |

## 주요 UI 동작

- **헤더**: 데스크톱은 검색/저장한 맛집/마이페이지가 인라인 노출, 모바일(`md` 미만)에서는 햄버거(☰) 메뉴로 전환
- **로그인 상태**: 로그인 시 헤더 버튼이 "로그인" → "로그아웃"으로 전환
- **검색 결과 필터**: 실제로 mock 데이터에 대해 동작(평점, 리뷰 품질, 현지인 비율, 영업상태, 카드결제, 도보거리, 예약가능)
- **저장 기능**: 맛집 상세의 ⭐ 버튼 → 비로그인 시 `/login`으로 이동, 로그인 상태면 `savedIds`에 추가/제거(localStorage에 유지) → 마이페이지·저장한 맛집 화면에 반영
- **로그인 보호**: `/mypage`는 `ProtectedRoute` 컴포넌트로 감싸져 있어 비로그인 접근 시 `/login`으로 리다이렉트, 로그인 후 원래 경로로 복귀

## 아직 안 된 것 (다음 단계)

- Supabase 연동: `profiles` · `restaurants` · `reviews_cache` · `saved_places` 테이블 실제 생성 및 RLS 적용
- Flask 백엔드: 네이버 블로그 검색 API, 구글 Places API 호출 및 리뷰 LLM 협찬 필터링 로직
- Supabase Auth 실제 이메일/비밀번호 인증 (현재는 이메일만 입력하면 통과하는 가짜 로그인)
- 구글 소셜 로그인
- 실제 위치 기반 백업 플랜 로직(현재는 mock 데이터 중 영업중인 첫 번째 맛집을 고정으로 보여줌)
- CLAUDE.md 작성 후 화면별 실제 개발 착수

## 참고 문서

- `./PRD.md` — 전체 기획 문서 (문제정의 → 시장 → MoSCoW → 사이트맵 → DB 설계 → 기술스택 → KPI 등)
- [와이어프레임 아티팩트](https://claude.ai/code/artifact/b2aa2e21-ea95-4376-b332-f06f53530b39) — 모바일/데스크톱 화면 + DB 설계도 + 시스템 아키텍처
