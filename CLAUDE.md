# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gurume Tabi (구루메 타비) — a Japan travel restaurant review platform. This is the **frontend skeleton only**: 100% mock data (`src/data/mockRestaurants.js`) and fake localStorage-based auth (`AuthContext.login(email)` accepts any email, no password check, no backend). See `../PRD.md` for the full product spec.

## Commands

```bash
npm run dev      # vite dev server
npm run build    # vite build
npm run lint      # oxlint (NOT eslint — config at .oxlintrc.json)
npm run preview  # preview production build
npm test         # vitest run (Vitest + React Testing Library, jsdom env)
```

Test files live next to the code they test (`*.test.jsx`). Vitest config is inline in `vite.config.js` (`test: {...}`), setup file at `src/setupTests.js`.

## Styling — Tailwind v4, no config file

Theme lives in `src/index.css` inside an `@theme{}` block — there is **no `tailwind.config.js`**. Custom tokens to know about:

- Brand colors: `--color-brand-navy` (#6D28D9), `--color-brand-coral` (#A855F7), `--color-brand-peach` (#EDE4FB), each with a `-dark` variant. Plus `--color-status-open/closed/soldout`. These are NOT Tailwind defaults — use `bg-brand-coral`, `text-brand-navy`, etc.
- Font-size scale is **overridden**, not default Tailwind: `text-xs` through `text-2xl` are each shifted up one step (e.g. `text-base` = 1.125rem, not 1rem). Don't assume default Tailwind type sizing when reasoning about pixel values — check `src/index.css` `@theme` block first.
- Body has a global gradient background + `background-attachment: fixed` set directly in `index.css`, outside Tailwind utilities.
- Large media (video/full-bleed hero images, the logo) live in `public/` and are referenced by absolute path (`/sushi.mp4`, `/logo.png`, `/loginBg.png`) instead of being imported from `src/assets` — intentional, so Vite doesn't try to bundle/hash them. Smaller decorative images (e.g. `src/assets/hero.png`) still use the normal `import x from '../assets/...'` pattern; don't "fix" the inconsistency by converting one to the other without checking which pages use which.

## Code style

- Single quotes, no semicolons, function components only
- State management: React Context only (`src/context/AuthContext.jsx`), no Redux/Zustand
- Custom hook pattern: `useAuth()` wraps `useContext(AuthContext)`, defined in the same file as the provider. `AuthContext` itself is also exported (for tests to wrap components in a mock `AuthContext.Provider` without going through `AuthProvider`'s localStorage logic) — this trips oxlint's `only-export-components` warning, which is expected and fine here
- Tailwind classes inlined directly in JSX; helper functions like `navLinkClass(isActive)` return template-string class combinations — no `clsx`/`cva`

## Routing & auth

- Routes declared in `src/App.jsx` via `<Routes>/<Route>`
- `ProtectedRoute` (`src/components/ProtectedRoute.jsx`) wraps any route requiring login — redirects to `/login` with `state={{from: location}}`, and `LoginPage` redirects back to that location after a successful login. `/mypage` and `/saved` are both wrapped.
- `/signup` is a placeholder page only — no real registration logic yet

## Gotchas

- Brand name is "Gurume Tabi" everywhere in the UI/PRD now. The old duplicate skeleton (formerly at `../jtaste-pass`, first-draft "J-Taste Pass" branding) was deleted — this `gurumeTabi` folder is the only live copy.
- Nothing is wired to a real backend — no Supabase, no Flask, no API keys. Don't assume any network call actually works; all data flows through `src/data/mockRestaurants.js` and `localStorage`.
- Project root also contains unrelated Korean `.docx` worksheet files and a `drive-download-*.zip` — these are course/planning materials, not app code, and are gitignored (`*.docx`, `drive-download-*.zip`).
- `design-system/MASTER.md` + `design-system/mockups/*.html` are a separate design-token reference and standalone HTML prototypes generated via the `ui-ux-pro-max` skill — not part of the live React app, not wired to any route. Don't confuse them with the real pages in `src/pages/`; treat `MASTER.md` as documentation of tokens that already exist in `src/index.css`, not a new source of truth to sync colors from.
- `src/pages/HomePage.jsx.bak` is a manual pre-rework snapshot of `HomePage.jsx` (kept as a safety-net backup, not imported anywhere) — ignore it unless asked to restore/diff against it.
