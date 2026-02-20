import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { goToNoEscalatedState, gotoMiaPage } from './helpers.mjs';

const SELECTORS = {
  maybeButton: '#maybeButton',
  yesButton: '#yesButton',
  question: '#valentineQuestion',
  secretInput: '#secretInput',
  secretOverlay: '#secretOverlay',
  secretCloseButton: '#secretCloseButton'
};

const TEXT = {
  success: 'Yayyy!! :3'
};

const analyzeAccessibility = async (page) => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(
        results.violations,
        results.violations
          .map((violation) => `${violation.id}: ${violation.help}`)
          .join('\n')
      ).toEqual([]);
      return;
    } catch (error) {
      lastError = error;
      if (!(error instanceof Error) || !error.message.includes('Execution context was destroyed') || attempt > 0) {
        throw error;
      }
      await gotoMiaPage(page);
    }
  }

  throw lastError;
};

test.describe('@a11y core states', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMiaPage(page);
  });

  test('@a11y initial state has no critical accessibility violations', async ({ page }) => {
    await analyzeAccessibility(page);
  });

  test('@a11y maybe state has no critical accessibility violations', async ({ page }) => {
    await page.locator(SELECTORS.maybeButton).click();
    await analyzeAccessibility(page);
  });

  test('@a11y no state has no critical accessibility violations', async ({ page }) => {
    await goToNoEscalatedState(page);
    await analyzeAccessibility(page);
  });

  test('@a11y yes state has no critical accessibility violations', async ({ page }) => {
    await page.locator(SELECTORS.yesButton).click();
    await expect(page.locator(SELECTORS.question)).toHaveText(TEXT.success);
    await analyzeAccessibility(page);
  });

  test('@a11y secret dialog keeps focus and closes via escape', async ({ page }) => {
    const input = page.locator(SELECTORS.secretInput);
    const overlay = page.locator(SELECTORS.secretOverlay);
    const closeButton = page.locator(SELECTORS.secretCloseButton);

    await input.click();
    await input.fill('mia');

    await expect(overlay).toHaveAttribute('aria-hidden', 'false');
    await expect(overlay).toBeVisible();
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(input).toBeFocused();
  });
});
