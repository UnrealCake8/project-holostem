import { test, expect } from '@playwright/test';

test('Frontend verification', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');

  // Log all classes of all elements to see what is going on
  const elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).map(el => ({
      tagName: el.tagName,
      className: el.className,
      innerText: el.innerText
    }));
  });
  // console.log(elements);

  await page.waitForSelector('nav');
  await page.screenshot({ path: 'screenshot_dashboard.png' });

  // Try to find any button or link to click
  const buttons = page.locator('button');
  const count = await buttons.count();
  console.log(`Found ${count} buttons`);

  if (count > 0) {
    await buttons.first().screenshot({ path: 'first_button.png' });
  }

  // Look for View page link
  const viewPageLink = page.locator('a:has-text("View page")');
  if (await viewPageLink.count() > 0) {
     console.log('Found View page link');
     await viewPageLink.first().click();
     await page.waitForURL(/\/video\/.+/);
     await page.screenshot({ path: 'screenshot_video_page.png' });
  } else {
     console.log('View page link NOT found');
  }
});
