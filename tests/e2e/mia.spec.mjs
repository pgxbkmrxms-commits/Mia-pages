import { test, expect } from '@playwright/test';
import { gotoMiaPage } from './helpers.mjs';

const TEXT = {
  question: 'Willst du meine Freundin sein?',
  yes: 'Ja',
  maybe: 'Vielleicht',
  no: 'Nein',
  success: 'Yayyy!! :3'
};

const SELECTORS = {
  maybeButton: '#maybeButton',
  yesButton: '#yesButton',
  noButton: '#noButton',
  subtext: '#subtext',
  question: '#valentineQuestion',
  responseButtons: '#responseButtons',
  secretInput: '#secretInput',
  secretOverlay: '#secretOverlay'
};

const triggerYesShortcut = async (page, question) => {
  await expect
    .poll(
      async () => {
        await page.keyboard.press('y');
        return question.textContent();
      },
      {
        timeout: 1500,
        intervals: [60, 80, 120, 160, 220]
      }
    )
    .toBe(TEXT.success);
};

test.describe('mia interaction flow', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMiaPage(page, { waitUntil: 'load' });
  });

  test('main page renders key controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: TEXT.question })).toBeVisible();
    await expect(page.getByRole('button', { name: TEXT.yes })).toBeVisible();
    await expect(page.getByRole('button', { name: TEXT.maybe })).toBeVisible();
    await expect(page.getByRole('button', { name: TEXT.no })).toBeVisible();
  });

  test('maybe updates subtext and yes completes flow', async ({ page }) => {
    const maybeButton = page.locator(SELECTORS.maybeButton);
    const yesButton = page.locator(SELECTORS.yesButton);
    const subtext = page.locator(SELECTORS.subtext);

    const initialText = await subtext.textContent();
    await maybeButton.click();
    await expect(subtext).not.toHaveText(initialText || '');

    await yesButton.click();
    await expect(page.getByRole('heading', { name: TEXT.success })).toBeVisible();
    await expect(page.locator(SELECTORS.responseButtons)).toBeHidden();
  });

  test('keyboard shortcuts work for no and yes', async ({ page }) => {
    const noButton = page.locator(SELECTORS.noButton);
    const question = page.locator(SELECTORS.question);

    await page.keyboard.press('n');
    await expect(noButton).toHaveText(/Bist du dir sicher\?/);

    await triggerYesShortcut(page, question);
  });

  test('secret code opens and closes overlay', async ({ page }) => {
    const input = page.locator(SELECTORS.secretInput);
    const overlay = page.locator(SELECTORS.secretOverlay);

    await input.click();
    await input.type('mia');
    await expect(overlay).toHaveAttribute('aria-hidden', 'false');
    await expect(overlay).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });
});
