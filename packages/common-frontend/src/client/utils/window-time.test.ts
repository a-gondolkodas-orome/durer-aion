import { validateStartWindow } from 'schemas';
import { windowTimeNow } from './window-time';

describe('windowTimeNow', () => {
  it('is a time the start window takes, to the minute', () => {
    const time = windowTimeNow(new Date('2026-11-13T11:56:42Z'));
    expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    expect(validateStartWindow({ opensAt: time })).toEqual([]);
  });

  it('names the same moment as the date it was given', () => {
    const now = new Date('2026-11-13T11:56:00Z');
    expect(Date.parse(windowTimeNow(now))).toBe(now.getTime());
  });
});
