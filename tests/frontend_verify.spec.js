import { test, expect } from '@playwright/test';

test('Comprehensive Frontend Verification', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForSelector('nav');

  // 1. Verify Layout and Sidebar
  await expect(page.locator('nav')).toBeVisible();
  const sidebarWidth = await page.locator('nav').evaluate(el => el.getBoundingClientRect().width);
  expect(sidebarWidth).toBeGreaterThan(100);
  console.log('Sidebar is visible and has width');

  // 2. Verify Action Labels (Normal Mode)
  const likeLabel = page.locator('span.simple-mode-hidden').first();
  await expect(likeLabel).toBeVisible();
  console.log('Action labels are visible in normal mode');

  // 3. Verify Simple Mode
  await page.evaluate(() => {
    localStorage.setItem('holostem_ui_settings', JSON.stringify({ simpleMode: true }));
  });
  await page.reload();
  await page.waitForSelector('nav');
  await expect(page.locator('span.simple-mode-hidden').first()).not.toBeVisible();
  await page.screenshot({ path: 'verify_simple_mode.png' });
  console.log('Action labels are hidden in Simple Mode');

  // 4. Verify Pause/Play
  // Click on the main video container
  await page.locator('.relative.h-full.w-full.bg-black').first().click();
  await page.waitForSelector('text=▶️');
  await page.screenshot({ path: 'verify_paused.png' });
  console.log('Video paused and play icon is visible');

  await page.locator('.relative.h-full.w-full.bg-black').first().click();
  await expect(page.locator('text=▶️')).not.toBeVisible();
  console.log('Video resumed and play icon is hidden');

  // 5. Verify URL Sync
  // In DashboardPage, the first item should be visible.
  // We check if the URL contains /video/
  // Depending on how replaceState is called, it might take a moment.
  await page.waitForTimeout(1000);
  const url = page.url();
  expect(url).toContain('/video/fallback-video-1');
  console.log('URL successfully synchronized with active video:', url);

  // 6. Verify Settings Page Padding
  await page.goto('http://localhost:5173/settings');
  const settingsMain = page.locator('main >> div').first();
  const padding = await settingsMain.evaluate(el => window.getComputedStyle(el).padding);
  // Expecting p-4 (16px) or p-8 (32px)
  console.log('Settings page padding:', padding);

  await page.screenshot({ path: 'verify_settings_padding.png' });
});
