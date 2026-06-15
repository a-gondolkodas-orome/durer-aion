import { getOptimalBotStep } from './bot-strategy';

describe('superstitious-counting getOptimalBotStep', () => {
  it('returns any valid step when remainder is 0 (any step wins)', () => {
    // (20 - 6) % 14 === 0
    const step = getOptimalBotStep({ current: 6, target: 20, restricted: 3 });
    expect(step).toBeGreaterThanOrEqual(1);
    expect(step).toBeLessThanOrEqual(12);
    expect(step).not.toBe(3);
  });

  it('returns any valid step when remainder is 1 (any step loses)', () => {
    // (15 - 0) % 14 === 1
    const step = getOptimalBotStep({ current: 0, target: 15, restricted: 5 });
    expect(step).toBeGreaterThanOrEqual(1);
    expect(step).toBeLessThanOrEqual(12);
    expect(step).not.toBe(5);
  });

  it('returns the unique winning step when it is not restricted', () => {
    // (20 - 1) % 14 === 5, winning step = 5 - 1 = 4
    expect(getOptimalBotStep({ current: 1, target: 20, restricted: 2 })).toBe(4);
  });

  it('returns the unique winning step for another board state', () => {
    // (21 - 2) % 14 === 5, winning step = 4
    expect(getOptimalBotStep({ current: 2, target: 21, restricted: 1 })).toBe(4);
  });

  it('falls back to a valid random step when the winning step equals restricted', () => {
    // (20 - 1) % 14 === 5, winning step = 4, but 4 is restricted
    const step = getOptimalBotStep({ current: 1, target: 20, restricted: 4 });
    expect(step).toBeGreaterThanOrEqual(1);
    expect(step).toBeLessThanOrEqual(12);
    expect(step).not.toBe(4);
  });
});
