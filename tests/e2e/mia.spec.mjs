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

  const maybeButton = page.locator('#maybeButton');
  const yesButton = page.locator('#yesButton');
  const subtext = page.locator('#subtext');

  const initialText = await subtext.textContent();
  await maybeButton.click();
  await expect(subtext).not.toHaveText(initialText || '');

  await yesButton.click();
  await expect(page.getByRole('heading', { name: 'Yayyy!! :3' })).toBeVisible();
  await expect(page.locator('#responseButtons')).toBeHidden();
});

test('keyboard shortcuts work for no and yes', async ({ page }) => {
  await page.goto('/mia-optimized.html');

  const noButton = page.locator('#noButton');
  const question = page.locator('#valentineQuestion');

  await page.keyboard.press('n');
  await expect(noButton).toHaveText(/Bist du dir sicher\?/);

  await page.waitForTimeout(250);
  await page.keyboard.press('y');
  await expect(question).toHaveText('Yayyy!! :3');
});

test('secret code opens and closes overlay', async ({ page }) => {
  await page.goto('/mia-optimized.html');

  const input = page.locator('#secretInput');
  const overlay = page.locator('#secretOverlay');

  await input.click();
  await input.type('mia');
  await expect(overlay).toHaveAttribute('aria-hidden', 'false');
  await expect(overlay).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
});
