// @vitest-environment jsdom
import { renderHook, render, act, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-context';

// jsdom implements no `matchMedia` at all, so the `system` branch — the default
// one — throws until a test provides it. The stub keeps its listeners so both the
// subscription and its cleanup can be asserted.
const stubMatchMedia = (matches: boolean) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = ((media: string) => ({
    media,
    matches,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)
  })) as unknown as typeof window.matchMedia;

  return {
    listenerCount: () => listeners.size,
    emit: (dark: boolean) =>
      act(() => listeners.forEach(listener => listener({ matches: dark } as MediaQueryListEvent)))
  };
};

const isDark = () => document.documentElement.classList.contains('dark');
const renderTheme = () => renderHook(() => useTheme(), { wrapper: ThemeProvider });

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  stubMatchMedia(false);
});

afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

describe('ThemeProvider', () => {
  it('applies the theme an earlier session stored', () => {
    localStorage.setItem('theme', 'dark');
    expect(renderTheme().result.current.theme).toBe('dark');
    expect(isDark()).toBe(true);
  });

  it('drops the dark class for a stored light theme', () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.add('dark');

    expect(renderTheme().result.current.theme).toBe('light');
    expect(isDark()).toBe(false);
  });

  it.each([true, false])('follows the OS preference when unset (prefers dark: %s)', prefersDark => {
    stubMatchMedia(prefersDark);

    expect(renderTheme().result.current.theme).toBe('system');
    expect(isDark()).toBe(prefersDark);
  });

  it('follows the OS preference as it changes', () => {
    const mq = stubMatchMedia(false);
    renderTheme();

    mq.emit(true);
    expect(isDark()).toBe(true);

    mq.emit(false);
    expect(isDark()).toBe(false);
  });

  it('unsubscribes from the media query on unmount', () => {
    const mq = stubMatchMedia(false);
    const { unmount } = renderTheme();
    expect(mq.listenerCount()).toBe(1);

    unmount();
    expect(mq.listenerCount()).toBe(0);
  });

  it('persists an explicit choice and applies it', () => {
    const { result } = renderTheme();

    act(() => result.current.setTheme('dark'));

    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(isDark()).toBe(true);
  });

  it('forgets the stored choice on going back to system, and follows the OS again', () => {
    const mq = stubMatchMedia(true);
    localStorage.setItem('theme', 'light');
    const { result } = renderTheme();

    act(() => result.current.setTheme('system'));

    expect(localStorage.getItem('theme')).toBeNull();
    expect(isDark()).toBe(true);
    expect(mq.listenerCount()).toBe(1);
  });
});

describe('useTheme', () => {
  it('reports the system default outside a provider, with an inert setter', () => {
    const seen: string[] = [];
    const Consumer = () => {
      const { theme, setTheme } = useTheme();
      seen.push(theme);
      return <button onClick={() => setTheme('dark')}>{theme}</button>;
    };
    render(<Consumer />);

    expect(seen).toEqual(['system']);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});
