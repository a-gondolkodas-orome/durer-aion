// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
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
const button = (label: string) => screen.getByLabelText(label);
const isActive = (label: string) => button(label).className.includes('font-bold');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  stubMatchMedia();
});

afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

describe('ThemeSwitcher', () => {
  it('marks the theme in use, which is system until one is chosen', () => {
    renderSwitcher();

    expect(isActive('System theme')).toBe(true);
    expect(isActive('Light mode')).toBe(false);
    expect(isActive('Dark mode')).toBe(false);
  });

  it('marks the theme an earlier session stored', () => {
    localStorage.setItem('theme', 'light');
    renderSwitcher();

    expect(isActive('Light mode')).toBe(true);
    expect(isActive('System theme')).toBe(false);
  });

  it('switches the theme, and the page with it', () => {
    renderSwitcher();

    fireEvent.click(button('Dark mode'));

    expect(isActive('Dark mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('switches back to light, and back to following the OS', () => {
    localStorage.setItem('theme', 'dark');
    renderSwitcher();

    fireEvent.click(button('Light mode'));
    expect(isActive('Light mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(button('System theme'));
    expect(isActive('System theme')).toBe(true);
    expect(localStorage.getItem('theme')).toBeNull();
  });
});
