import { describe, it, expect } from 'vitest';
import {
  generateId,
  deepClone,
  shuffleArray,
  pickRandom,
  clamp,
  weightedRandom,
  formatNumber,
} from './utils';

describe('generateId', () => {
  it('should generate a unique ID with default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^id_[a-z0-9]+_[a-z0-9]+$/);
  });

  it('should generate a unique ID with custom prefix', () => {
    const id = generateId('card');
    expect(id).toMatch(/^card_[a-z0-9]+_[a-z0-9]+$/);
  });

  it('should generate different IDs on each call', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(true)).toBe(true);
  });

  it('should clone arrays', () => {
    const original = [1, 2, 3];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('should clone nested objects', () => {
    const original = { a: 1, b: { c: 2, d: [3, 4] } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b.d).not.toBe(original.b.d);
  });
});

describe('shuffleArray', () => {
  it('should return the same array reference', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray(arr);
    expect(result).toBe(arr);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffleArray(arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle empty arrays', () => {
    const arr: number[] = [];
    shuffleArray(arr);
    expect(arr).toEqual([]);
  });
});

describe('pickRandom', () => {
  it('should return requested number of items', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = pickRandom(arr, 3);
    expect(result).toHaveLength(3);
  });

  it('should return items from the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = pickRandom(arr, 2);
    result.forEach((item) => {
      expect(arr).toContain(item);
    });
  });

  it('should default to 1 item', () => {
    const arr = [1, 2, 3];
    const result = pickRandom(arr);
    expect(result).toHaveLength(1);
  });
});

describe('clamp', () => {
  it('should clamp value below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp value above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should handle min equal to max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe('weightedRandom', () => {
  it('should return an item from the array', () => {
    const items = ['a', 'b', 'c'];
    const weights = [1, 1, 1];
    const result = weightedRandom(items, weights);
    expect(items).toContain(result);
  });

  it('should favor items with higher weights', () => {
    const items = ['rare', 'common'];
    const weights = [1, 99];

    // Run multiple times to check distribution
    const results: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 1000; i++) {
      const result = weightedRandom(items, weights);
      results[result]++;
    }

    // Common should appear much more often
    expect(results['common']).toBeGreaterThan(results['rare'] * 5);
  });
});

describe('formatNumber', () => {
  it('should format numbers below 1000', () => {
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999000)).toBe('999.0K');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('should format billions with B suffix', () => {
    expect(formatNumber(1000000000)).toBe('1.0B');
    expect(formatNumber(7500000000)).toBe('7.5B');
  });
});
