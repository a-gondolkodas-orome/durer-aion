// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { LanguageProvider, browserLanguage } from './language-context';
import { useLanguage } from 'strategy-engine/react';

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

// jsdom's browser is American English, which the provider would follow; the
// site's audience browses in Hungarian.
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['hu-HU']);
});

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

  it('clears the URL but stores the choice when Hungarian — the default — is chosen back', () => {
    localStorage.setItem('lang', 'en');
    renderAt('/?lang=en');

    fireEvent.click(screen.getByText('choose hu'));

    expect(language()).toBe('hu');
    expect(search()).toBe('');
    expect(localStorage.getItem('lang')).toBe('hu');
  });

  it('follows the browser language when nothing was chosen, without storing it', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB', 'de']);
    renderAt();
    expect(language()).toBe('en');
    expect(localStorage.getItem('lang')).toBeNull();
  });

  it('keeps Hungarian chosen in an English browser', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB']);
    renderAt('/?lang=en');

    fireEvent.click(screen.getByText('choose hu'));
    cleanup();
    renderAt();

    expect(language()).toBe('hu');
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

describe('browserLanguage', () => {
  it('is Hungarian when the browser lists it anywhere, even after English', () => {
    expect(browserLanguage(['en-US', 'HU'])).toBe('hu');
    expect(browserLanguage(['hu-HU'])).toBe('hu');
  });

  it('is English when the browser lists no Hungarian, whatever it lists instead', () => {
    expect(browserLanguage(['en-GB'])).toBe('en');
    expect(browserLanguage(['de-DE', 'fr'])).toBe('en');
  });

  it('is null for an empty list', () => {
    expect(browserLanguage([])).toBeNull();
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
