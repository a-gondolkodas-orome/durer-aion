import { reportUnexpectedState } from './unexpected-state';

describe('reportUnexpectedState', () => {
  it('throws in dev so the bug surfaces where it happened', () => {
    expect(() => reportUnexpectedState('cube-coloring: every vertex is banned'))
      .toThrow('cube-coloring: every vertex is banned');
  });

  describe('in production (import.meta.env.DEV = false)', () => {
    beforeEach(() => { vi.stubEnv('DEV', false); });
    afterEach(() => { vi.unstubAllEnvs(); });

    it('warns and returns so the caller can take its fallback', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => reportUnexpectedState('cube-coloring: every vertex is banned')).not.toThrow();
      expect(warn).toHaveBeenCalledWith('cube-coloring: every vertex is banned');
      warn.mockRestore();
    });
  });
});
