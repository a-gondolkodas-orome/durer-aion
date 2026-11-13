import { startWindowState } from './competition';

describe('startWindowState', () => {
  const window = { opensAt: '2026-10-20T15:00:00+02:00', closesAt: '2026-10-20T21:30:00+02:00' };

  it('is open at any time without a window', () => {
    expect(startWindowState(undefined, new Date('2000-01-01T00:00:00Z'))).toBe('open');
  });

  it('opens at opensAt, read in its own offset', () => {
    expect(startWindowState(window, new Date('2026-10-20T12:59:59Z'))).toBe('not-open-yet');
    expect(startWindowState(window, new Date('2026-10-20T13:00:00Z'))).toBe('open');
  });

  it('is closed from closesAt on', () => {
    expect(startWindowState(window, new Date('2026-10-20T19:29:59Z'))).toBe('open');
    expect(startWindowState(window, new Date('2026-10-20T19:30:00Z'))).toBe('closed');
  });

  it('stays open without a closesAt', () => {
    expect(startWindowState({ opensAt: window.opensAt }, new Date('2099-01-01T00:00:00Z'))).toBe('open');
  });
});
