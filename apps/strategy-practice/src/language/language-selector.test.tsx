// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from './language-context';
import { LanguageSelector } from './language-selector';

const renderSelector = (entry = '/') => render(
  <MemoryRouter initialEntries={[entry]}>
    <LanguageProvider><LanguageSelector /></LanguageProvider>
  </MemoryRouter>
);

const isActive = (label: string) => screen.getByLabelText(label).className.includes('font-bold');

beforeEach(() => localStorage.clear());

describe('LanguageSelector', () => {
  it('marks Hungarian, the language until one is chosen', () => {
    renderSelector();

    expect(isActive('Magyar')).toBe(true);
    expect(isActive('English')).toBe(false);
  });

  it('marks the language the URL asked for', () => {
    renderSelector('/?lang=en');

    expect(isActive('English')).toBe(true);
    expect(isActive('Magyar')).toBe(false);
  });

  it('switches the language, storing the choice', () => {
    renderSelector();

    fireEvent.click(screen.getByLabelText('English'));

    expect(isActive('English')).toBe(true);
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('switches back to Hungarian, storing nothing since it is the default', () => {
    renderSelector('/?lang=en');

    fireEvent.click(screen.getByLabelText('Magyar'));

    expect(isActive('Magyar')).toBe(true);
    expect(localStorage.getItem('lang')).toBeNull();
  });
});
