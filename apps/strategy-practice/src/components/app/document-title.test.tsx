// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider, useLanguage } from 'language';
import { gameList } from '../games/gameList';
import { useDocumentTitle } from './document-title';

const Harness = () => {
  useDocumentTitle();
  const { setLanguage } = useLanguage();
  return <button onClick={() => setLanguage('hu')}>choose hu</button>;
};

const renderAt = (entry: string) => render(
  <MemoryRouter initialEntries={[entry]}>
    <LanguageProvider><Harness /></LanguageProvider>
  </MemoryRouter>
);

const [gameId, game] = Object.entries(gameList)[0];

beforeEach(() => localStorage.clear());

describe('useDocumentTitle', () => {
  it('names the site in Hungarian by default', () => {
    renderAt('/');
    expect(document.title).toBe('Dürer játékok');
    expect(document.documentElement.lang).toBe('hu');
  });

  it('follows the language param', () => {
    renderAt('/?lang=en');
    expect(document.title).toBe('Dürer games');
    expect(document.documentElement.lang).toBe('en');
  });

  it('puts the game name first on a game page', () => {
    renderAt(`/game/${gameId}?lang=en`);
    expect(document.title).toBe(`${game.name.en} – Dürer games`);
  });

  it('falls back to the site name for an unknown game', () => {
    renderAt('/game/NoSuchGame');
    expect(document.title).toBe('Dürer játékok');
  });

  it('changes when the language is switched', () => {
    const { getByText } = renderAt(`/game/${gameId}?lang=en`);

    fireEvent.click(getByText('choose hu'));

    expect(document.title).toBe(`${game.name.hu} – Dürer játékok`);
    expect(document.documentElement.lang).toBe('hu');
  });
});
