// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GameHeader } from './game-header';

const headingAt = (path: string) => {
  render(<MemoryRouter initialEntries={[path]}><GameHeader /></MemoryRouter>);
  return screen.getByRole('heading', { level: 1 }).textContent;
};

describe('GameHeader', () => {
  it('names the game from the catalog', () => {
    expect(headingAt('/game/ChessRook')).toBe('Barangolás bástyával');
  });

  // The router plays the game at these paths too, so the header names it.
  it('names the game at a path with a trailing slash', () => {
    expect(headingAt('/game/ChessRook/')).toBe('Barangolás bástyával');
  });

  it('names the game at a path in other case', () => {
    expect(headingAt(`/game/${'ChessRook'.toLowerCase()}`)).toBe('Barangolás bástyával');
  });

  it('is empty off a game path', () => {
    expect(headingAt('/game/NoSuchGame')).toBe('');
  });
});
