// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import * as games from './index';

// The companion to plays-to-an-end.spec.ts, which plays every variant headlessly
// and so never renders a BoardClient. This does the other half: every registered
// game mounts and puts something clickable on the page. It is deliberately shallow
// — a game's own spec is where behaviour belongs — but it is what catches a shared
// BoardClient that one of its games no longer fits.
describe.each(Object.entries(games))('%s', (_name, Game) => {
  it('renders a board with something to click', () => {
    const { container } = render(<MemoryRouter><Game /></MemoryRouter>);
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  });
});
