const { calculateDeletionTime } = require('./timeUtils');
// describe, it, expect, vi are now provided globally by vitest.config.js

describe('calculateDeletionTime', () => {
  it('should return a time exactly 24 hours in the future when battleTime is null', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00Z'));
    
    const now = Date.now();
    const expectedTime = now + 24 * 60 * 60 * 1000;
    const result = calculateDeletionTime(null);
    
    expect(result).toBe(expectedTime);
    
    vi.useRealTimers();
  });

  it('should return a time exactly 12 hours after the provided battle time', () => {
    const battleTimeISO = '2026-05-10T10:00:00.000Z';
    const battleTime = new Date(battleTimeISO).getTime();
    const expectedTime = battleTime + 12 * 60 * 60 * 1000;
    const result = calculateDeletionTime(battleTimeISO);
    
    expect(result).toBe(expectedTime);
  });
});
