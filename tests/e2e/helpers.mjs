import { expect } from '@playwright/test';

export const MIA_URL = '/mia-optimized.html';
const CARD_SELECTOR = '.card';
const NO_BUTTON_SELECTOR = '#noButton';
const DETERMINISTIC_RANDOM_VALUE = 0.123456789;

const defaultGotoOptions = {
  waitUntil: 'networkidle',
  reducedMotion: false,
  deterministicRandom: false,
  settleMs: 0
};

const isPositiveNumber = (value) => Number.isFinite(value) && value > 0;

const applyDeterministicRandom = async (page) => {
  await page.addInitScript((randomValue) => {
    Math.random = () => randomValue;
  }, DETERMINISTIC_RANDOM_VALUE);
};

const applyReducedMotion = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
};

const waitForCardReady = async (page) => {
  await expect(page.locator(CARD_SELECTOR)).toBeVisible();
};

/**
 * Öffnet die Seite in einem stabilen Test-Zustand.
 */
export const gotoMiaPage = async (page, options = {}) => {
  const {
    waitUntil,
    reducedMotion,
    deterministicRandom,
    settleMs
  } = { ...defaultGotoOptions, ...options };

  if (deterministicRandom) {
    await applyDeterministicRandom(page);
  }

  if (reducedMotion) {
    await applyReducedMotion(page);
  }

  await page.goto(MIA_URL, { waitUntil });
  await waitForCardReady(page);

  if (isPositiveNumber(settleMs)) {
    await page.waitForTimeout(settleMs);
  }
};

/**
 * Führt den "Nein"-Pfad bis zum eskalierten Zustand aus.
 */
export const goToNoEscalatedState = async (page) => {
  const noButton = page.locator(NO_BUTTON_SELECTOR);
  await noButton.click();
  await noButton.click();
  return noButton;
};
