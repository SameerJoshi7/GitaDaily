import { calculateStreak } from '../utils/streak.js';
import { jest } from '@jest/globals';

describe('Streak Calculation Logic', () => {
  it('sets currentStreak to 1 for first activity', () => {
    const result = calculateStreak(null, 0, 0, new Date('2023-10-15T12:00:00Z'));
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('increments streak if active yesterday', () => {
    const lastActive = new Date('2023-10-14T10:00:00Z');
    const now = new Date('2023-10-15T12:00:00Z');
    const result = calculateStreak(lastActive, 5, 5, now);
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });

  it('keeps streak the same if active today', () => {
    const lastActive = new Date('2023-10-15T08:00:00Z');
    const now = new Date('2023-10-15T12:00:00Z');
    const result = calculateStreak(lastActive, 5, 5, now);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
  });

  it('resets streak to 1 if active > 1 day ago', () => {
    const lastActive = new Date('2023-10-10T10:00:00Z');
    const now = new Date('2023-10-15T12:00:00Z');
    const result = calculateStreak(lastActive, 5, 10, now);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10); // longest preserved
  });
});
