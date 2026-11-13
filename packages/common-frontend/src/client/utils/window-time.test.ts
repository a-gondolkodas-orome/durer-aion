import { validateStartWindow } from 'schemas';
import { windowText, windowTimeNow, windowTimeText } from './window-time';

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

describe('windowTimeText', () => {
  // Read out in the browser's zone, which the test does not pin; the stored
  // text follows unchanged, so the zone it was typed in stays visible.
  it('reads the time out with its year and zone, then gives it as stored', () => {
    expect(windowTimeText('2026-11-20T12:00+01:00'))
      .toMatch(/^2026\. november 2[01]\. \d{2}:\d{2} \S.* \(2026-11-20T12:00\+01:00\)$/);
  });
});

describe('windowText', () => {
  it('is any time without a window', () => {
    expect(windowText(null)).toBe('bármikor');
  });

  it('leaves out the end of an open-ended window', () => {
    expect(windowText({ opensAt: '2026-11-20T12:00+01:00' })).toBe(`${windowTimeText('2026-11-20T12:00+01:00')} után`);
  });
});
