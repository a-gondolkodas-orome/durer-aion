// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { LanguageProvider, useLanguage } from './language-context';

// The provider reads the language from two places at once — the `?lang=` param and
// localStorage — and writes both, so the harness exposes the URL as well.
const Harness = () => {
  const { language, setLanguage } = useLanguage();
  const { search } = useLocation();

  return <>
    <span data-testid="language">{language}</span>
    <span data-testid="search">{search}</span>
    <button onClick={() => setLanguage('en')}>choose en</button>
    <button onClick={() => setLanguage('hu')}>choose hu</button>
    <Link to="/?lang=en">link with lang</Link>
    <Link to="/elsewhere">link without lang</Link>
  </>;
};

const renderAt = (entry = '/') => render(
  <MemoryRouter initialEntries={[entry]}>
    <LanguageProvider><Harness /></LanguageProvider>
  </MemoryRouter>
);

const language = () => screen.getByTestId('language').textContent;
const search = () => screen.getByTestId('search').textContent;

beforeEach(() => localStorage.clear());

describe('LanguageProvider', () => {
  it('is Hungarian when nothing says otherwise', () => {
    renderAt();
    expect(language()).toBe('hu');
  });

  it('reads back the language an earlier session stored', () => {
    localStorage.setItem('lang', 'en');
    renderAt();
    expect(language()).toBe('en');
  });

  it('lets the URL win over the stored language, so a shared link opens as sent', () => {
    localStorage.setItem('lang', 'hu');
    renderAt('/?lang=en');
    expect(language()).toBe('en');
  });

  it('writes both the URL and the store when English is chosen', () => {
    renderAt();

    fireEvent.click(screen.getByText('choose en'));

    expect(language()).toBe('en');
    expect(search()).toBe('?lang=en');
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('clears both when Hungarian — the default — is chosen back', () => {
    localStorage.setItem('lang', 'en');
    renderAt('/?lang=en');

    fireEvent.click(screen.getByText('choose hu'));

    expect(language()).toBe('hu');
    expect(search()).toBe('');
    expect(localStorage.getItem('lang')).toBeNull();
  });

  it('follows a navigation that carries a lang param', () => {
    renderAt();

    fireEvent.click(screen.getByText('link with lang'));

    expect(language()).toBe('en');
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('keeps the language across a navigation that drops the param', () => {
    renderAt('/?lang=en');

    fireEvent.click(screen.getByText('link without lang'));

    expect(search()).toBe('');
    expect(language()).toBe('en');
  });
});

describe('useLanguage', () => {
  it('is Hungarian outside a provider, with an inert setter', () => {
    const Consumer = () => {
      const { language, setLanguage } = useLanguage();
      return <button onClick={() => setLanguage('en')}>{language}</button>;
    };
    render(<Consumer />);

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('hu');
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});
