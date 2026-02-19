import { clamp, createShuffledCycler, matchesSecretCode, normalizeSecretCode } from './mia-logic.mjs';

// Configuration constants
const CONFIG = {
  DEBUG: false,
  BUTTON_GROW_WIDTH: 20,
  BUTTON_GROW_HEIGHT: 20,
  FONT_SIZE_INCREASE: 6,
  MAX_BUTTON_WIDTH_FACTOR: 0.8,
  MAX_BUTTON_HEIGHT: 200,
  MAX_FONT_SIZE: 40,
  CONFETTI_TIMEOUT: 5000,
  PRELOAD_TIMEOUT: 2000,
  PRELOAD_FALLBACK: 100,
  CONFETTI_DELAYS: [0, 250, 550],
  STORAGE_KEY: 'valentineState',
  HAPTIC_LIGHT: 10,
  HAPTIC_MEDIUM: 20,
  HAPTIC_HEAVY: 50,
  SWIPE_THRESHOLD: 50,
  STATE_MAX_AGE_MS: 3600000,
  STATUS_CLEAR_MS: 2800,
  SHAKE_RESET_DELAY_MS: 320,
  SECRET_CODE: 'mia',
  ENABLE_ERROR_TELEMETRY: false,
  TELEMETRY_STORAGE_KEY: 'valentineErrorTelemetry',
  TELEMETRY_MAX_ITEMS: 20
};

const logDebug = (...args) => {
  if (CONFIG.DEBUG) {
    console.log(...args);
  }
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

// Haptic Feedback
const hapticFeedback = (intensity = CONFIG.HAPTIC_LIGHT) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(intensity);
  }
};

let audioContext = null;
const getAudioContext = () => {
  if (audioContext) {
    return audioContext;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  audioContext = new AudioContextClass();
  return audioContext;
};

const playCuteChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    master.connect(ctx.destination);

    [523.25, 659.25, 783.99].forEach((freq, index) => {
      const start = now + index * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) {
    // ignore audio errors
  }
};

// Performance monitoring
const logPerformance = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    try {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        logDebug('Load time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
      }
    } catch (e) {
      // Ignore errors
    }
  }
};

// Connection-aware loading
const shouldPreload = () => {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    if (conn.saveData) return false;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return false;
  }
  return true;
};

// State management
const saveState = () => {
  try {
    const state = { noClickCount, yesGrowStep, timestamp: Date.now() };
    sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
};

const loadState = () => {
  try {
    const saved = sessionStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      const age = Date.now() - (state.timestamp || 0);
      if (age < CONFIG.STATE_MAX_AGE_MS) return state;
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return null;
};

const clearState = () => {
  try {
    sessionStorage.removeItem(CONFIG.STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear state:', e);
  }
};

const getErrorTelemetry = () => {
  try {
    const raw = localStorage.getItem(CONFIG.TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveErrorTelemetry = (entries) => {
  try {
    localStorage.setItem(CONFIG.TELEMETRY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    logDebug('Telemetry save failed', e);
  }
};

const clearErrorTelemetry = () => {
  try {
    localStorage.removeItem(CONFIG.TELEMETRY_STORAGE_KEY);
  } catch (e) {
    logDebug('Telemetry clear failed', e);
  }
};

const toTelemetryText = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
};

const recordErrorTelemetry = (type, data = {}) => {
  if (!CONFIG.ENABLE_ERROR_TELEMETRY) {
    return;
  }
  const entries = getErrorTelemetry();
  entries.push({
    type,
    time: new Date().toISOString(),
    path: window.location.pathname,
    ...data
  });
  const trimmed = entries.slice(-CONFIG.TELEMETRY_MAX_ITEMS);
  saveErrorTelemetry(trimmed);
};

const runRegressionChecks = () => {
  const checks = [];
  const assert = (condition, label) => {
    checks.push({ label, ok: !!condition });
  };

  assert(clamp(5, 0, 3) === 3, 'clamp upper bound');
  assert(clamp(-2, 0, 3) === 0, 'clamp lower bound');
  assert(normalizeSecretCode('M-I A!!') === 'mia', 'secret code normalization');

  let secretOpened = 0;
  const opened = handleSecretCodeInput('M-I A!!', () => { secretOpened += 1; });
  assert(opened && secretOpened === 1, 'secret code normalization + callback');
  assert(!handleSecretCodeInput('not-it', () => {}), 'secret code rejects invalid input');

  const sample = new Set();
  const sampleSize = Math.min(6, maybeTexts.length);
  for (let i = 0; i < sampleSize; i += 1) {
    sample.add(getNextMaybeText());
  }
  assert(sample.size === sampleSize, 'maybe cycle has no duplicates');

  const failed = checks.filter((item) => !item.ok);
  if (failed.length) {
    console.warn('Regression checks failed:', failed.map((item) => item.label));
  } else {
    logDebug('Regression checks passed:', checks.length);
  }
};

const createDebugTelemetryPanel = () => {
  if (!CONFIG.DEBUG) {
    return;
  }

  const panel = document.createElement('div');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Debugwerkzeuge');
  panel.className = 'debug-panel';

  const makeButton = (label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'debug-panel-button';
    return btn;
  };

  const exportButton = makeButton('Telemetry kopieren');
  exportButton.addEventListener('click', async () => {
    const entries = getErrorTelemetry();
    const payload = JSON.stringify(entries, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setStatus(`Telemetry kopiert (${entries.length} Einträge).`);
    } catch (e) {
      setStatus('Kopieren fehlgeschlagen – siehe Konsole.', { isError: true });
      console.warn('Telemetry copy failed:', e, payload);
    }
  });

  const clearButton = makeButton('Telemetry leeren');
  clearButton.addEventListener('click', () => {
    clearErrorTelemetry();
    setStatus('Telemetry geleert.');
  });

  panel.appendChild(exportButton);
  panel.appendChild(clearButton);
  document.body.appendChild(panel);
};

let statusClearTimeoutId = null;

const setStatus = (message, { isError = false, persist = false } = {}) => {
  if (!statusEl) {
    return;
  }
  if (statusClearTimeoutId) {
    clearTimeout(statusClearTimeoutId);
    statusClearTimeoutId = null;
  }
  statusEl.textContent = message;
  statusEl.classList.toggle('is-visible', !!message);
  statusEl.classList.toggle('status-error', isError);
  if (!persist && message) {
    statusClearTimeoutId = setTimeout(() => {
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.classList.remove('is-visible');
      statusEl.classList.remove('status-error');
      statusClearTimeoutId = null;
    }, CONFIG.STATUS_CLEAR_MS);
  }
};

// Error boundary
const showError = (message) => {
  setStatus(message, { isError: true });
};

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  recordErrorTelemetry('error', {
    message: toTelemetryText(event.message || event.error),
    source: toTelemetryText(event.filename),
    line: event.lineno || null,
    column: event.colno || null,
    stack: toTelemetryText(event.error && event.error.stack)
  });
  showError('Ein Fehler ist aufgetreten. Bitte Seite neu laden.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  recordErrorTelemetry('unhandledrejection', {
    reason: toTelemetryText(event.reason)
  });
});

if (CONFIG.DEBUG) {
  window.__miaDebug = {
    getErrorTelemetry,
    clearErrorTelemetry,
    runRegressionChecks
  };
}

// Cleanup listeners array
const listeners = [];
const addListener = (element, event, handler, options) => {
  element.addEventListener(event, handler, options);
  listeners.push({ element, event, handler, options });
};

const cleanup = () => {
  listeners.forEach(({ element, event, handler, options }) => {
    element.removeEventListener(event, handler, options);
  });
  listeners.length = 0;
  if (statusClearTimeoutId) {
    clearTimeout(statusClearTimeoutId);
    statusClearTimeoutId = null;
  }
  if (heartsObserver) {
    heartsObserver.disconnect();
    heartsObserver = null;
  }
};

const getById = (id) => document.getElementById(id);

const imagePaths = [
  'images/giphy.gif',
  'images/image2.gif',
  'images/image3.gif',
  'images/image4.gif',
  'images/image5.gif',
  'images/image6.gif',
  'images/image7.gif'
];

const imageAlts = [
  'Willst du meine Freundin sein ? Frage an die wichtigste Person in meinem Leben',
  'Süße Reaktion 1',
  'Süße Reaktion 2',
  'Süße Reaktion 3',
  'Süße Reaktion 4',
  'Süße Reaktion 5',
  'Süße Reaktion 6'
];

const noTexts = [
  'Nein',
  'Bist du dir sicher?',
  'Ganz sicher?',
  'Wirklich ganz ganz sicher?:(',
  'Immernoch nicht?',
  'Warum nicht :('
];

const maybeTexts = [
  "Vielleicht? Ich nehm's als süßes Fast-Ja 💕",
  'Ich warte gern auf dein Ja 🫶',
  'Du bist jede Sekunde Warten wert ✨',
  'Okay, dann ein sanftes Vielleicht mit Sternenglanz 🌟',
  'Ich bleibe geduldig – du bist es wert 💗',
  'Heute offen, morgen offen – Hauptsache du 💌',
  'Ich sammle jedes Zögern wie kleine Herzchen 💖',
  'Kein Stress, ich hab Zeit für dein Tempo 🌸',
  'Vielleicht ist manchmal schon fast ein Ja 😇',
  'Ich mag dein Vielleicht trotzdem sehr 💞',
  'Ich schenk dir ein Lächeln für jede offene Antwort 😊',
  'Wir lassen der Sache Zeit und ganz viel Wärme ☀️',
  'Dein Tempo ist goldrichtig, ich bleib hier 🌼',
  'Ich hör dir zu, auch zwischen den Zeilen 💬',
  'Ein kleines Vielleicht kann groß anfangen 🌱',
  'Dann halte ich dir weiter die Tür zum Ja offen 🚪',
  'Mit dir fühlt sich sogar Warten schön an 🎈',
  'Ich bleib entspannt und freue mich auf dich 🕊️',
  'Kein Druck, nur Gefühl und ein bisschen Glitzer ✨',
  'Dein Herz darf sich alle Zeit der Welt nehmen ⏳',
  'Ich mag den Weg mit dir, nicht nur das Ziel 🛤️',
  'Dann gibt’s noch ein Maybe mit extra Sympathie 😌'
];

const finalIndex = imagePaths.length - 1;
const maxNoClicks = Math.min(noTexts.length - 1, finalIndex);
let confettiLoading = null;
let noClickCount = 0;
let yesGrowStep = 0;
let didPreload = false;
let didFallback = false;
let statusEl = null;
let heartsObserver = null;
const getNextMaybeText = createShuffledCycler(maybeTexts);
const pendingImageLoadHandlers = new WeakMap();

const yesGrowClasses = Array.from({ length: maxNoClicks }, (_, index) => `yes-grow-${index + 1}`);

const revealImage = (imageDisplay) => {
  requestAnimationFrame(() => imageDisplay.classList.remove('is-fading'));
};

const getFocusableElements = (container) => {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    return !el.hasAttribute('disabled') && el.tabIndex !== -1 && (el.offsetParent !== null || el.getClientRects().length > 0);
  });
};

const trapFocus = (container, event) => {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
  } else if (active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
};

const setImage = (imageDisplay, src, alt) => {
  const currentSrc = imageDisplay.src.split('?')[0];
  const newSrc = src.includes('://') ? src.split('?')[0] : new URL(src, window.location.href).href.split('?')[0];

  if (currentSrc === newSrc) return;

  imageDisplay.classList.add('is-fading');
  if (alt) {
    imageDisplay.alt = alt;
  }

  const previousLoadHandler = pendingImageLoadHandlers.get(imageDisplay);
  if (previousLoadHandler) {
    imageDisplay.removeEventListener('load', previousLoadHandler);
  }

  const onLoad = () => {
    pendingImageLoadHandlers.delete(imageDisplay);
    revealImage(imageDisplay);
  };

  pendingImageLoadHandlers.set(imageDisplay, onLoad);
  imageDisplay.addEventListener('load', onLoad, { once: true });
  imageDisplay.src = src;

  if (imageDisplay.complete && imageDisplay.naturalHeight !== 0) {
    imageDisplay.removeEventListener('load', onLoad);
    onLoad();
  }
};

const updateYesButton = (yesButton) => {
  yesButton.classList.remove(...yesGrowClasses);
  const normalizedStep = clamp(yesGrowStep, 0, maxNoClicks);
  if (normalizedStep > 0) {
    yesButton.classList.add(`yes-grow-${normalizedStep}`);
  }
};

const loadConfetti = () => {
  if (typeof confetti === 'function') {
    return Promise.resolve();
  }
  if (confettiLoading) {
    return confettiLoading;
  }
  confettiLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'libs/confetti.min.js';
    script.defer = true;
    const timer = setTimeout(() => {
      console.warn('Confetti loading timeout');
      resolve();
    }, CONFIG.CONFETTI_TIMEOUT);
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = (e) => {
      clearTimeout(timer);
      console.error('Confetti loading failed:', e);
      resolve();
    };
    document.head.appendChild(script);
  });
  return confettiLoading;
};

const handleNo = (yesButton, noButton, imageDisplay, card) => {
  if (noClickCount >= maxNoClicks) {
    return;
  }
  hapticFeedback(CONFIG.HAPTIC_MEDIUM);
  noClickCount += 1;
  setImage(imageDisplay, imagePaths[noClickCount], imageAlts[noClickCount] || imageAlts[0]);
  if (card) {
    card.classList.remove('shake');
    requestAnimationFrame(() => {
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), CONFIG.SHAKE_RESET_DELAY_MS);
    });
  }
  yesGrowStep = clamp(yesGrowStep + 1, 0, maxNoClicks);
  updateYesButton(yesButton);
  noButton.textContent = noTexts[noClickCount];
  noButton.setAttribute('aria-label', noButton.textContent);
  saveState();
  setStatus(`Du hast "${noButton.textContent}" gewählt.`);
  if (noClickCount >= maxNoClicks) {
    noButton.disabled = true;
    noButton.setAttribute('aria-disabled', 'true');
    noButton.setAttribute('aria-label', 'Nein – deaktiviert');
    setStatus('Okay, ich frage nicht mehr.', { persist: true });
  }
  // Intelligentes Prefetch: Lade nächstes Bild und finale Bild vor
  const nextIndex = Math.min(noClickCount + 1, finalIndex);
  if (nextIndex > noClickCount) {
    const img = new Image();
    img.src = imagePaths[nextIndex];
  }
  if (nextIndex !== finalIndex) {
    const finalImg = new Image();
    finalImg.src = imagePaths[finalIndex];
  }
  // Konfetti-Preload nach 2 Nein-Clicks
  if (noClickCount >= 2 && !confettiLoading) {
    loadConfetti().catch(() => {});
  }
};

const handleMaybe = (subtext, card, maybeButton) => {
  hapticFeedback(CONFIG.HAPTIC_LIGHT);
  playCuteChime();
  const text = getNextMaybeText();
  if (subtext) {
    subtext.textContent = text;
  }
  if (maybeButton) {
    maybeButton.setAttribute('aria-label', text);
  }
  setStatus(text);
  if (card) {
    card.classList.add('swipe-feedback');
    setTimeout(() => card.classList.remove('swipe-feedback'), 300);
  }
};

const handleYes = (valentineQuestion, responseButtons, imageDisplay, subtext, hint, afterActions) => {
  hapticFeedback(CONFIG.HAPTIC_HEAVY);
  playCuteChime();
  setImage(imageDisplay, imagePaths[finalIndex], 'Jubelndes GIF – Danke für dein Ja!');
  valentineQuestion.textContent = 'Yayyy!! :3';
  valentineQuestion.setAttribute('tabindex', '-1');
  valentineQuestion.focus({ preventScroll: true });
  if (subtext) {
    subtext.textContent = 'Du hast mir ein Lächeln geschenkt.';
  }
  if (hint) {
    hint.hidden = true;
  }
  setStatus('Danke für dein Ja!', { persist: true });
  responseButtons.hidden = true;
  responseButtons.setAttribute('aria-label', 'Antwortoptionen ausgeblendet');
  if (afterActions) {
    afterActions.hidden = false;
  }
  clearState();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loadConfetti()
      .then(() => {
        if (typeof confetti === 'function') {
          const fireConfetti = () => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          };
          CONFIG.CONFETTI_DELAYS.forEach((delay) => {
            setTimeout(fireConfetti, delay);
          });
        }
      })
      .catch((err) => {
        console.error('Confetti error:', err);
      });
  }
};

const handleSecretCodeInput = (value, openSecretOverlay) => {
  if (matchesSecretCode(value, CONFIG.SECRET_CODE)) {
    openSecretOverlay();
    return true;
  }
  return false;
};

const preloadOnFirstInteraction = () => {
  if (didPreload || !shouldPreload()) {
    return;
  }
  didPreload = true;
  const loadImages = () => {
    for (let i = 1; i < imagePaths.length; i += 1) {
      const img = new Image();
      img.src = imagePaths[i];
    }
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadImages, { timeout: CONFIG.PRELOAD_TIMEOUT });
  } else {
    setTimeout(loadImages, CONFIG.PRELOAD_FALLBACK);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const yesButton = getById('yesButton');
  const maybeButton = getById('maybeButton');
  const noButton = getById('noButton');
  const valentineQuestion = getById('valentineQuestion');
  const responseButtons = getById('responseButtons');
  const imageDisplay = getById('imageDisplay');
  const subtext = getById('subtext');
  const hint = getById('hint');
  const afterActions = getById('afterActions');
  const resetButton = getById('resetButton');
  const secretInput = getById('secretInput');
  const card = getById('card');
  const secretOverlay = getById('secretOverlay');
  const secretCard = getById('secretCard');
  const secretCloseButton = getById('secretCloseButton');
  let lastFocusedElement = null;
  statusEl = getById('status');

  if (!yesButton || !maybeButton || !noButton || !valentineQuestion || !responseButtons || !imageDisplay || !card) {
    console.error('Required elements not found');
    return;
  }

  if (secretInput) {
    secretInput.value = '';
  }

  const openSecretOverlay = () => {
    if (!secretOverlay) return;
    const activeElement = document.activeElement;
    lastFocusedElement = activeElement instanceof HTMLElement ? activeElement : null;
    secretOverlay.hidden = false;
    secretOverlay.setAttribute('aria-hidden', 'false');
    if (card) {
      card.setAttribute('aria-hidden', 'true');
      card.inert = true;
    }
    document.body.classList.add('no-scroll');
    playCuteChime();
    setStatus('Geheime Nachricht freigeschaltet 💖', { persist: true });
    if (secretInput) {
      secretInput.value = '';
    }
    const modalFocusTarget = getFocusableElements(secretCard)[0] || secretCloseButton || secretCard;
    if (modalFocusTarget && modalFocusTarget.focus) {
      modalFocusTarget.focus({ preventScroll: true });
    }
  };

  const closeSecretOverlay = () => {
    if (!secretOverlay) return;
    secretOverlay.hidden = true;
    secretOverlay.setAttribute('aria-hidden', 'true');
    if (card) {
      card.removeAttribute('aria-hidden');
      card.inert = false;
    }
    document.body.classList.remove('no-scroll');
    if (lastFocusedElement && document.contains(lastFocusedElement)) {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      yesButton.focus({ preventScroll: true });
    }
  };

  // Load saved state
  const savedState = loadState();
  if (savedState) {
    noClickCount = clamp(Number(savedState.noClickCount) || 0, 0, maxNoClicks);
    yesGrowStep = clamp(Number(savedState.yesGrowStep ?? savedState.noClickCount) || 0, 0, maxNoClicks);
    if (noClickCount > 0) {
      setImage(imageDisplay, imagePaths[noClickCount], imageAlts[noClickCount]);
      updateYesButton(yesButton);
      noButton.textContent = noTexts[noClickCount];
      noButton.setAttribute('aria-label', noButton.textContent);
      if (noClickCount >= maxNoClicks) {
        noButton.disabled = true;
        noButton.setAttribute('aria-disabled', 'true');
        noButton.setAttribute('aria-label', 'Nein – deaktiviert');
      }
    }
  } else {
    yesGrowStep = 0;
  }
  imageDisplay.classList.remove('is-fading');

  // Intersection Observer for hearts animation
  const heartsContainer = document.querySelector('.hearts');
  if (heartsContainer && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heartsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        heartsContainer.classList.toggle('paused', !entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    heartsObserver.observe(heartsContainer);
  }

  const firstNext = new Image();
  firstNext.src = imagePaths[1];

  imageDisplay.addEventListener('error', () => {
    if (didFallback) return;
    didFallback = true;
    setImage(imageDisplay, imagePaths[finalIndex], 'Fallback-Bild');
  });

  addListener(noButton, 'click', () => handleNo(yesButton, noButton, imageDisplay, card));
  addListener(maybeButton, 'click', () => handleMaybe(subtext, card, maybeButton));
  addListener(yesButton, 'click', () => handleYes(valentineQuestion, responseButtons, imageDisplay, subtext, hint, afterActions));
  if (secretCloseButton) {
    addListener(secretCloseButton, 'click', closeSecretOverlay);
  }
  if (secretOverlay) {
    addListener(secretOverlay, 'click', (event) => {
      if (event.target === secretOverlay) {
        closeSecretOverlay();
      }
    });
  }
  if (secretInput) {
    addListener(secretInput, 'input', (event) => {
      const inputEl = event.target;
      if (!inputEl || typeof inputEl.value !== 'string') return;
      if (handleSecretCodeInput(inputEl.value, openSecretOverlay)) {
        inputEl.value = '';
      }
    });
  }
  if (resetButton) {
    addListener(resetButton, 'click', () => {
      clearState();
      cleanup();
      window.location.reload();
    });
  }
  const events = ['pointerdown', 'touchstart', 'mousedown'];
  events.forEach((eventType) => {
    addListener(document, eventType, preloadOnFirstInteraction, { once: true, passive: true });
  });

  let lastKeyTime = 0;
  const KEY_DEBOUNCE = 200;

  addListener(
    document,
    'keydown',
    (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (secretOverlay && !secretOverlay.hidden) {
        if (key === 'escape') {
          event.preventDefault();
          closeSecretOverlay();
        } else if (key === 'tab') {
          trapFocus(secretCard || secretOverlay, event);
        }
        return;
      }

      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target && target.isContentEditable);
      if (isTypingTarget) {
        return;
      }

      if (responseButtons.hidden) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime < KEY_DEBOUNCE) {
        return;
      }

      if (key === 'y' || key === 'j') {
        event.preventDefault();
        lastKeyTime = now;
        yesButton.click();
      } else if (key === 'p') {
        event.preventDefault();
        lastKeyTime = now;
        maybeButton.click();
      } else if (key === 'n') {
        event.preventDefault();
        lastKeyTime = now;
        noButton.click();
      }
    },
    { passive: false }
  );

  // Page Visibility API - pause animations when tab is hidden
  addListener(document, 'visibilitychange', () => {
    const hearts = document.querySelector('.hearts');
    if (document.hidden && hearts) {
      hearts.classList.add('paused');
    } else if (hearts && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hearts.classList.remove('paused');
    }
  });

  // Cleanup on page unload
  addListener(window, 'beforeunload', () => {
    cleanup();
  });

  addListener(
    window,
    'resize',
    () => {
      updateYesButton(yesButton);
    },
    { passive: true }
  );

  // Touch gestures for mobile
  let touchStartX = 0;
  let touchStartY = 0;

  addListener(
    card,
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  addListener(
    card,
    'touchend',
    (e) => {
      if (responseButtons.hidden) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Swipe right for Yes, left for No
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > CONFIG.SWIPE_THRESHOLD) {
        hapticFeedback(CONFIG.HAPTIC_LIGHT);
        card.classList.add('swipe-feedback');
        setTimeout(() => card.classList.remove('swipe-feedback'), 300);

        if (deltaX > 0) {
          yesButton.click();
        } else {
          noButton.click();
        }
      }
    },
    { passive: true }
  );

  // Log performance metrics
  if (document.readyState === 'complete') {
    logPerformance();
  } else {
    addListener(window, 'load', logPerformance);
  }

  if (CONFIG.DEBUG) {
    runRegressionChecks();
    createDebugTelemetryPanel();
  }

  // Register Service Worker for offline functionality
  if ('serviceWorker' in navigator) {
    let hasRefreshedForUpdate = false;
    addListener(navigator.serviceWorker, 'controllerchange', () => {
      if (hasRefreshedForUpdate) {
        return;
      }
      hasRefreshedForUpdate = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then((registration) => {
          logDebug('Service Worker registered');

          const promptForUpdate = () => {
            if (!registration.waiting || !navigator.serviceWorker.controller) {
              return;
            }
            const shouldUpdate = window.confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?');
            if (shouldUpdate) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          };

          if (registration.waiting) {
            promptForUpdate();
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) {
              return;
            }
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                promptForUpdate();
              }
            });
          });
        })
        .catch(() => {
          logDebug('Service Worker registration failed');
        });
    });
  }
});
