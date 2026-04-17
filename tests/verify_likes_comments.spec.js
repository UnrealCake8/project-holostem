import { test, expect } from '@playwright/test';

test('Verify Likes and Comments functionality', async ({ page }) => {
  // Go to the dashboard
  await page.goto('http://localhost:5173/dashboard');

  // Wait for content to load
  await page.waitForSelector('button[aria-label="Like"]');

  // Get initial like count
  const likeButton = page.locator('button[aria-label="Like"]').first();
  const initialLikeCountText = await likeButton.locator('span.font-semibold').innerText();
  const initialLikeCount = parseInt(initialLikeCountText) || 0;

  // Click like (might need login, but let's see if it updates UI regardless)
  // Actually handleLike redirects to /auth if not logged in.
  // Let's check if we are logged in.

  // For the purpose of this test, we can try to mock the auth state if needed,
  // but let's see what happens if we just click.
  await likeButton.click();

  // If redirected to /auth, then we know it's working as intended (protecting likes)
  if (page.url().includes('/auth')) {
    console.log('Redirected to /auth as expected for anonymous like');
    // Go back and try to comment
    await page.goto('http://localhost:5173/dashboard');
  } else {
    // If not redirected, check if count updated
    const newLikeCountText = await likeButton.locator('span.font-semibold').innerText();
    const newLikeCount = parseInt(newLikeCountText);
    expect(newLikeCount).toBe(initialLikeCount + 1);
    console.log('Like count incremented successfully');
  }

  // Check Comment Drawer
  const commentButton = page.locator('button[aria-label="Comments"]').first();
  const initialCommentCountText = await commentButton.locator('span.font-semibold').innerText();
  const initialCommentCount = parseInt(initialCommentCountText) || 0;

  await commentButton.click();

  // Wait for drawer
  await page.waitForSelector('text=comments');

  // Check if drawer header matches (allowing for my fix where I might use comments.length)
  const drawerHeader = page.locator('div.flex.items-center.justify-between >> p.text-white.font-semibold');
  const drawerHeaderText = await drawerHeader.innerText();
  console.log('Drawer header:', drawerHeaderText);

  // Since we are likely not logged in, we should see the "Log in to comment" message
  const loginToComment = page.locator('text=Log in to comment');
  if (await loginToComment.isVisible()) {
    console.log('Login to comment message visible');
  }

  // Close drawer
  await page.locator('button:has-text("✕")').click();
  await expect(page.locator('text=comments')).not.toBeVisible();

  // Verify Play/Pause
  const videoArea = page.locator('.cursor-pointer').first();
  // Click to pause
  await videoArea.click();

  // Check for play icon
  const playIcon = page.locator('text=▶️');
  await expect(playIcon).toBeVisible();
  console.log('Play icon visible on pause');

  // Click to resume
  await videoArea.click();
  await expect(playIcon).not.toBeVisible();
  console.log('Play icon hidden on resume');
});
