// @vitest-environment jsdom
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from './theme-context';
import { ThemeSwitcher } from './theme-switcher';

// jsdom has no matchMedia, which ThemeProvider needs for the default `system` theme.
const stubMatchMedia = () => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  })) as unknown as typeof window.matchMedia;
};

const renderSwitcher = () => render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
// The select in Hungarian, the language every test starts in (test-setup.ts).
const select = () => screen.getByRole('combobox', { name: 'Megjelenés' });
const shown = () => select().textContent;
const choose = (label: string) => {
  fireEvent.mouseDown(select());
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }));
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  stubMatchMedia();
});

afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

describe('ThemeSwitcher', () => {
  it('marks the theme in use, which is system until one is chosen', () => {
    renderSwitcher();

    expect(shown()).toBe('Rendszer');
  });

  it('marks the theme an earlier session stored', () => {
    localStorage.setItem('theme', 'light');
    renderSwitcher();

    expect(shown()).toBe('Világos');
  });

  it('reads a stored theme the site does not offer as system', () => {
    localStorage.setItem('theme', 'auto');
    renderSwitcher();

    expect(shown()).toBe('Rendszer');
  });

  it('switches the theme, and the page with it', () => {
    renderSwitcher();

    choose('Sötét');

    expect(shown()).toBe('Sötét');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('switches back to light, and back to following the OS', () => {
    localStorage.setItem('theme', 'dark');
    renderSwitcher();

    choose('Világos');
    expect(shown()).toBe('Világos');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    choose('Rendszer');
    expect(shown()).toBe('Rendszer');
    expect(localStorage.getItem('theme')).toBeNull();
  });
});
