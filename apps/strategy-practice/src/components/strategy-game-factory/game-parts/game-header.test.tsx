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

  // The router matches the route with a trailing slash, or in other case; the
  // catalog key does not, and once showed through as a raw `.name`.
  it('shows no raw key for a path the catalog does not know', () => {
    expect(headingAt('/game/ChessRook/')).toBe('');
  });
});
