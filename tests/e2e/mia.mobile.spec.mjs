import { test, expect } from '@playwright/test';
import { gotoMiaPage } from './helpers.mjs';

const SELECTORS = {
  card: '.card',
  yesButton: '#yesButton',
  noButton: '#noButton',
  question: '#valentineQuestion',
  responseButtons: '#responseButtons'
};

const TEXT = {
  success: 'Yayyy!! :3' // From mia-optimized.js
};

// Helper: simulate a simple horizontal swipe
// Note: We use manual TouchEvent dispatch because Playwright's high-level gesture
// support is currently limited for complex custom swipes without full mobile driver stack.
const simulateSwipe = async (page, selector, direction = 'right') => {
  const locator = page.locator(selector);
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Element ${selector} not found`);

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  // Swipe distance needs to be > SWIPE_THRESHOLD (50px in config)
  const endX = direction === 'right' ? startX + 150 : startX - 150;

  await page.evaluate(({ selector, startX, startY, endX }) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element ${selector} not found in DOM`);

    const touchId = 1;
    
    // Create consistent Touch objects (supported in modern browsers)
    const touchStart = new Touch({
      identifier: touchId,
      target: element,
      clientX: startX,
      clientY: startY,
      screenX: startX,
      screenY: startY,
      pageX: startX,
      pageY: startY,
      radiusX: 1,
      radiusY: 1,
      force: 0.5
    });

    const touchEnd = new Touch({
      identifier: touchId,
      target: element,
      clientX: endX,
      clientY: startY,
      screenX: endX,
      screenY: startY,
      pageX: endX,
      pageY: startY,
      radiusX: 1,
      radiusY: 1,
      force: 0.5
    });

    // Dispatch touchstart
    element.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [touchStart],
      targetTouches: [touchStart],
      changedTouches: [touchStart]
    }));

    // Dispatch touchend
    // For touchend, touches is empty (finger lifted), changedTouches contains the end state
    element.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: [touchEnd]
    }));
  }, { selector, startX, startY, endX });
};

test.describe('mobile interactions', () => {
  // Use mobile emulation settings for these tests
  test.use({ 
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    // Pixel 5 emulation string to ensure Chrome treats it as mobile
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
  });

  test.beforeEach(async ({ page }) => {
    await gotoMiaPage(page);
  });

  test('swipe right triggers yes flow', async ({ page }) => {
    const successHeading = page.getByRole('heading', { name: TEXT.success });
    const responseButtons = page.locator(SELECTORS.responseButtons);

    // Verify initial state
    await expect(successHeading).toBeHidden();
    await expect(responseButtons).toBeVisible();

    // Perform Right Swipe on the card
    await simulateSwipe(page, SELECTORS.card, 'right');

    // Verify success
    await expect(successHeading).toBeVisible();
    await expect(responseButtons).toBeHidden();
  });

  test('swipe left triggers no flow (escalation)', async ({ page }) => {
    const noButton = page.locator(SELECTORS.noButton);

    // Initial state check
    await expect(noButton).toHaveText('Nein');

    // Perform Left Swipe on the card
    await simulateSwipe(page, SELECTORS.card, 'left');

    // Verify button text changes (escalation logic triggered)
    await expect(noButton).not.toHaveText('Nein');
  });
});
