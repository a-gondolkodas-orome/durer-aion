// @vitest-environment jsdom
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from './language-context';
import { LanguageSelector } from './language-selector';

const renderSelector = (entry = '/') => render(
  <MemoryRouter initialEntries={[entry]}>
    <LanguageProvider><LanguageSelector /></LanguageProvider>
  </MemoryRouter>
);

// Named in the language showing, so each test finds it by either name.
const select = () => screen.getByRole('combobox', { name: /^(Nyelv|Language)$/ });
const shown = () => select().textContent;
const choose = (label: string) => {
  fireEvent.mouseDown(select());
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }));
};

// jsdom's browser is American English, which the provider would follow; the
// site's audience browses in Hungarian.
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['hu-HU']);
});

describe('LanguageSelector', () => {
  it('marks Hungarian, the language until one is chosen', () => {
    renderSelector();

    expect(shown()).toBe('Magyar');
  });

  it('marks the language the URL asked for', () => {
    renderSelector('/?lang=en');

    expect(shown()).toBe('English');
  });

  it('switches the language, storing the choice', () => {
    renderSelector();

    choose('English');

    expect(shown()).toBe('English');
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('switches back to Hungarian, storing it so the browser language does not win', () => {
    renderSelector('/?lang=en');

    choose('Magyar');

    expect(shown()).toBe('Magyar');
    expect(localStorage.getItem('lang')).toBe('hu');
  });
});
