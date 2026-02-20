import { test, expect } from '@playwright/test';
import { goToNoEscalatedState, gotoMiaPage } from './helpers.mjs';

const SELECTORS = {
  card: '.card',
  imageDisplay: '#imageDisplay',
  hearts: '.hearts',
  maybeButton: '#maybeButton',
  yesButton: '#yesButton',
  question: '#valentineQuestion',
  responseButtons: '#responseButtons'
};

const TEXT = {
  initialNoButtonLabel: 'Nein',
  success: 'Yayyy!! :3'
};

const VIEWPORTS = [
  { name: 'desktop', size: { width: 1280, height: 720 } },
  { name: 'mobile', size: { width: 390, height: 844 } }
];

const baseScreenshotOptions = {
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.03
};

const takeCardSnapshot = async (page, name) => {
  await expect(page.locator(SELECTORS.card)).toHaveScreenshot(name, {
    ...baseScreenshotOptions,
    mask: [page.locator(SELECTORS.imageDisplay), page.locator(SELECTORS.hearts)]
  });
};

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} visual snapshots`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport.size);
      await gotoMiaPage(page, {
        waitUntil: 'load',
        reducedMotion: true,
        deterministicRandom: true,
        settleMs: 250
      });
    });

    test(`@visual ${viewport.name} initial state`, async ({ page }) => {
      await takeCardSnapshot(page, `${viewport.name}-initial.png`);
    });

    test(`@visual ${viewport.name} maybe state`, async ({ page }) => {
      await page.locator(SELECTORS.maybeButton).click();
      await takeCardSnapshot(page, `${viewport.name}-maybe.png`);
    });

    test(`@visual ${viewport.name} no escalation state`, async ({ page }) => {
      const noButton = await goToNoEscalatedState(page);
      await expect(noButton).not.toHaveText(TEXT.initialNoButtonLabel);
      await takeCardSnapshot(page, `${viewport.name}-no.png`);
    });

    test(`@visual ${viewport.name} yes state`, async ({ page }) => {
      await page.locator(SELECTORS.yesButton).click();
      await expect(page.locator(SELECTORS.question)).toHaveText(TEXT.success);
      await expect(page.locator(SELECTORS.responseButtons)).toBeHidden();
      await takeCardSnapshot(page, `${viewport.name}-yes.png`);
    });
  });
}
