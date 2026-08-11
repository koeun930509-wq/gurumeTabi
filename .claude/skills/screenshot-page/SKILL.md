---
name: screenshot-page
description: Screenshot a route of this Vite app (gurumeTabi) at a given viewport using Playwright, so a UI change can be visually verified instead of just assumed. Use after any change to a page or component under src/pages or src/components, or when the user asks to "see" or "확인" a screen.
---

Use this to visually verify a UI change in this project. The dev server must already be running on `http://localhost:5173` (check with `netstat -ano | grep :5173` on Windows/Git Bash before starting a new one).

1. Ensure Playwright with Chromium is available. If not yet installed in the scratchpad, set it up once:
   ```bash
   cd <scratchpad-dir>
   npm init -y
   npm install playwright
   npx playwright install chromium
   ```

2. Write a small script to the scratchpad directory (not the repo) that navigates and screenshots:
   ```js
   import { chromium } from 'playwright';
   const browser = await chromium.launch();
   const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); // adjust width for mobile (390) vs desktop (1440+)
   await page.goto('http://localhost:5173/<path>', { waitUntil: 'networkidle' });
   await page.screenshot({ path: '<scratchpad>/<name>.png', fullPage: false });
   await browser.close();
   ```

3. If the route requires login (routes wrapped in `ProtectedRoute`, e.g. `/mypage`, `/saved`), log in first before navigating:
   ```js
   await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
   await page.fill('input[type="email"]', 'test@example.com');
   await page.fill('input[type="password"]', 'password123');
   await page.click('button[type="submit"]');
   await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
   ```
   Auth is fake — any email/password combination logs in (see `src/context/AuthContext.jsx`).

4. Run the script with `node`, then read the resulting PNG with the Read tool to actually look at it. Don't report a UI change as verified without viewing the screenshot.

5. For responsive checks, take one shot at mobile width (390px) and one at desktop width (1440px) — this project has distinct mobile/PC layouts in several pages (e.g. `MyPage.jsx` branches on `md:` breakpoint).
