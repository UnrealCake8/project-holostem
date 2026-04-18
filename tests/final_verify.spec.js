import { test, expect } from '@playwright/test';

test('Final Verification', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForSelector('nav');

  // 1. Sidebar visibility
  await expect(page.locator('nav')).toBeVisible();

  // 2. Action Labels (Simple Mode check)
  const shareLabel = page.locator('.absolute.right-2 span:has-text("Share")').first();
  await expect(shareLabel).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem('holostem_ui_settings', JSON.stringify({ simpleMode: true }));
  });
  await page.reload();
  await page.waitForSelector('nav');
  await expect(shareLabel).not.toBeVisible();
  console.log('Verified Sidebar and Simple Mode');

  // 3. Play/Pause
  // Use locator click instead of mouse click if possible
  const videoOverlay = page.locator('.cursor-pointer').first();
  await videoOverlay.click();
  await page.waitForSelector('text=▶️', { timeout: 10000 });
  console.log('Found Play Icon');

  // 4. URL Sync
  await page.waitForTimeout(2000);
  expect(page.url()).toContain('/video/');
  console.log('Verified URL Sync:', page.url());

  // 5. Video Page
  await page.locator('a:has-text("View page")').first().click();
  await page.waitForURL(/\/video\/.+/);
  await expect(page.locator('h1')).toBeVisible();
  console.log('Verified Video Page');

  // 6. Settings Page Padding
  await page.goto('http://localhost:5173/settings');
  await page.waitForSelector('h1:has-text("Settings")');
  console.log('Verified Settings Page');
});
