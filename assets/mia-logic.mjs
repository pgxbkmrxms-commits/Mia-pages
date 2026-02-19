export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const normalizeSecretCode = (value) => String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');

export const matchesSecretCode = (value, expectedCode = 'mia') => {
  return normalizeSecretCode(value) === normalizeSecretCode(expectedCode);
};

const randomizeIndices = (length, rng = Math.random) => {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

export const createShuffledCycler = (items, rng = Math.random) => {
  if (!Array.isArray(items) || items.length === 0) {
    return () => undefined;
  }

  let pool = [];
  let lastIndex = -1;

  const refill = () => {
    pool = randomizeIndices(items.length, rng);
    if (pool.length > 1 && pool[0] === lastIndex) {
      [pool[0], pool[1]] = [pool[1], pool[0]];
    }
  };

  return () => {
    if (!pool.length) {
      refill();
    }
    const nextIndex = pool.shift();
    lastIndex = Number.isInteger(nextIndex) ? nextIndex : 0;
    return items[lastIndex];
  };
};
