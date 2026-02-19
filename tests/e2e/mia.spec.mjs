import { test, expect } from '@playwright/test';

test('main page renders key controls', async ({ page }) => {
  await page.goto('/mia-optimized.html');

  await expect(page.getByRole('heading', { name: 'Willst du meine Freundin sein?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ja' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vielleicht' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nein' })).toBeVisible();
});

test('maybe updates subtext and yes completes flow', async ({ page }) => {
  await page.goto('/mia-optimized.html');

  const maybeButton = page.getByRole('button', { name: /Vielleicht/i });
  const yesButton = page.getByRole('button', { name: 'Ja' });
  const subtext = page.locator('#subtext');

  const initialText = await subtext.textContent();
  await maybeButton.click();
  await expect(subtext).not.toHaveText(initialText || '');

  await yesButton.click();
  await expect(page.getByRole('heading', { name: 'Yayyy!! :3' })).toBeVisible();
  await expect(page.locator('#responseButtons')).toBeHidden();
});
