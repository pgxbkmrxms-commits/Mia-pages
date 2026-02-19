import test from 'node:test';
import assert from 'node:assert/strict';

import { clamp, createShuffledCycler, matchesSecretCode, normalizeSecretCode } from '../assets/mia-logic.mjs';

test('clamp keeps values inside bounds', () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-2, 0, 3), 0);
  assert.equal(clamp(2, 0, 3), 2);
});

test('normalizeSecretCode strips non letters and lowercases', () => {
  assert.equal(normalizeSecretCode('M-I A!!'), 'mia');
  assert.equal(normalizeSecretCode('  MiA 123'), 'mia');
});

test('matchesSecretCode compares normalized values', () => {
  assert.equal(matchesSecretCode('M-I A!!', 'mia'), true);
  assert.equal(matchesSecretCode('not-it', 'mia'), false);
});

test('createShuffledCycler iterates all entries without duplicates per cycle', () => {
  const values = ['a', 'b', 'c', 'd'];
  const rngSequence = [0.2, 0.7, 0.1, 0.9, 0.3, 0.8, 0.4, 0.6];
  let i = 0;
  const rng = () => {
    const current = rngSequence[i % rngSequence.length];
    i += 1;
    return current;
  };

  const next = createShuffledCycler(values, rng);
  const firstRound = new Set([next(), next(), next(), next()]);
  assert.equal(firstRound.size, values.length);

  const secondRound = [next(), next(), next(), next()];
  assert.equal(new Set(secondRound).size, values.length);
});
