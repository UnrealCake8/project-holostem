# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/final_verify.spec.js >> Final Verification
- Location: tests/final_verify.spec.js:3:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('.cursor-pointer').first()

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - complementary [ref=e5]:
    - link "HoloStem" [ref=e6] [cursor=pointer]:
      - /url: /dashboard
    - generic [ref=e7]: 🔍 Search
    - navigation [ref=e8]:
      - link "🏠 For You" [ref=e9] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e10]: 🏠
        - generic [ref=e11]: For You
      - link "🧭 Explore" [ref=e12] [cursor=pointer]:
        - /url: /dashboard?tab=explore
        - generic [ref=e13]: 🧭
        - generic [ref=e14]: Explore
      - link "🫧 Following" [ref=e15] [cursor=pointer]:
        - /url: /dashboard?tab=following
        - generic [ref=e16]: 🫧
        - generic [ref=e17]: Following
      - link "👥 Friends" [ref=e18] [cursor=pointer]:
        - /url: /dashboard?tab=friends
        - generic [ref=e19]: 👥
        - generic [ref=e20]: Friends
      - link "🔔 Activity" [ref=e21] [cursor=pointer]:
        - /url: /dashboard?tab=activity
        - generic [ref=e22]: 🔔
        - generic [ref=e23]: Activity
      - link "⬆️ Upload" [ref=e24] [cursor=pointer]:
        - /url: /upload
        - generic [ref=e25]: ⬆️
        - generic [ref=e26]: Upload
      - link "👤 Profile" [ref=e27] [cursor=pointer]:
        - /url: /profile
        - generic [ref=e28]: 👤
        - generic [ref=e29]: Profile
      - link "⚙️ Settings" [ref=e30] [cursor=pointer]:
        - /url: /settings
        - generic [ref=e31]: ⚙️
        - generic [ref=e32]: Settings
    - link "Login / Sign up" [ref=e33] [cursor=pointer]:
      - /url: /auth
  - main [ref=e34]:
    - generic [ref=e35]:
      - generic [ref=e36]:
        - button "← Back" [ref=e37] [cursor=pointer]
        - paragraph [ref=e38]: Solar Systems in 60 Seconds
      - generic [ref=e39]:
        - iframe [ref=e41]:
          - generic "YouTube Video Player" [ref=f3e3]:
            - alert [ref=f3e5]:
              - generic [ref=f3e6]:
                - generic [ref=f3e7]:
                  - img
                - generic [ref=f3e8]:
                  - generic [ref=f3e9]: Video unavailable
                  - generic [ref=f3e10]: This content isn’t available.
              - link "Visit YouTube to search for more videos" [ref=f3e11] [cursor=pointer]:
                - /url: https://www.youtube.com
                - img
        - generic [ref=e42]:
          - link "H @holostem_team" [ref=e43] [cursor=pointer]:
            - /url: /u/holostem_team
            - generic [ref=e44]: H
            - generic [ref=e45]: "@holostem_team"
          - heading "Solar Systems in 60 Seconds" [level=1] [ref=e46]
          - paragraph [ref=e47]: A fast visual introduction to planets and orbits.
          - generic [ref=e48]:
            - generic [ref=e49]: video
            - generic [ref=e50]: Science
          - generic [ref=e51]:
            - button "🤍 0 Likes" [ref=e52] [cursor=pointer]:
              - generic [ref=e53]: 🤍
              - text: 0 Likes
            - button "↗️ Share" [ref=e54] [cursor=pointer]:
              - generic [ref=e55]: ↗️
              - text: Share
        - generic [ref=e56]:
          - heading "0 Comments" [level=2] [ref=e57]
          - paragraph [ref=e59]: No comments yet. Be the first!
          - paragraph [ref=e62]:
            - link "Log in" [ref=e63] [cursor=pointer]:
              - /url: /auth
            - text: to comment
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Final Verification', async ({ page }) => {
  4  |   await page.goto('http://localhost:5173/dashboard');
  5  |   await page.waitForSelector('nav');
  6  |
  7  |   // 1. Sidebar visibility
  8  |   await expect(page.locator('nav')).toBeVisible();
  9  |
  10 |   // 2. Action Labels (Simple Mode check)
  11 |   const shareLabel = page.locator('.absolute.right-2 span:has-text("Share")').first();
  12 |   await expect(shareLabel).toBeVisible();
  13 |
  14 |   await page.evaluate(() => {
  15 |     localStorage.setItem('holostem_ui_settings', JSON.stringify({ simpleMode: true }));
  16 |   });
  17 |   await page.reload();
  18 |   await page.waitForSelector('nav');
  19 |   await expect(shareLabel).not.toBeVisible();
  20 |   console.log('Verified Sidebar and Simple Mode');
  21 |
  22 |   // 3. Play/Pause
  23 |   // Use locator click instead of mouse click if possible
  24 |   const videoOverlay = page.locator('.cursor-pointer').first();
> 25 |   await videoOverlay.click();
     |                      ^ Error: locator.click: Test timeout of 60000ms exceeded.
  26 |   await page.waitForSelector('text=▶️', { timeout: 10000 });
  27 |   console.log('Found Play Icon');
  28 |
  29 |   // 4. URL Sync
  30 |   await page.waitForTimeout(2000);
  31 |   expect(page.url()).toContain('/video/');
  32 |   console.log('Verified URL Sync:', page.url());
  33 |
  34 |   // 5. Video Page
  35 |   await page.locator('a:has-text("View page")').first().click();
  36 |   await page.waitForURL(/\/video\/.+/);
  37 |   await expect(page.locator('h1')).toBeVisible();
  38 |   console.log('Verified Video Page');
  39 |
  40 |   // 6. Settings Page Padding
  41 |   await page.goto('http://localhost:5173/settings');
  42 |   await page.waitForSelector('h1:has-text("Settings")');
  43 |   console.log('Verified Settings Page');
  44 | });
  45 |
```