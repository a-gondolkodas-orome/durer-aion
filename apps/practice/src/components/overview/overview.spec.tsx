// @vitest-environment jsdom
import { render, screen, within, fireEvent } from '@testing-library/react';
import { Overview } from './overview';
import type { Category, GameList, IconKey } from '../games/gameList';
import { HashRouter } from 'react-router';

type CanonicalConstants = { iconKeys: readonly IconKey[]; categories: readonly Category[] };

vi.mock('../games/gameList', async (importOriginal): Promise<CanonicalConstants & { gameList: GameList }> => ({
  ...(await importOriginal<CanonicalConstants>()),
  gameList: {
    GameA1: {
      name: { hu: 'A egy' },
      category: ['A'],
      year: { k: '', v: '11/12' },
      round: 'döntő',
      featured: true,
      icon: 'chess'
    },
    GameA2: { name: { hu: 'A kettő' }, category: ['A'], year: { k: '', v: '12/13' }, round: 'döntő', icon: 'number' },
    GameB1: { name: { hu: 'B egy' }, category: ['B'], year: { k: '', v: '13/14' }, round: 'döntő', icon: 'number' },
    GameC1: { name: { hu: 'C egy' }, category: ['C'], year: { k: '', v: '14/15' }, round: 'online', icon: 'coins' },
    GameCD: { name: { hu: 'CD' }, category: ['C', 'D'], year: { k: '', v: '15/16' }, round: 'döntő', icon: 'piles' }
  }
}));

const renderOverview = () => render(<HashRouter><Overview /></HashRouter>);

describe('Overview', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the featured strip with only featured games', () => {
    renderOverview();
    const strip = screen.getByTestId('featured-strip');
    expect(within(strip).getAllByTestId('game-card')).toHaveLength(1);
    expect(within(strip).getByText('A egy')).toBeTruthy();
  });

  it('keeps both sections collapsed by default, showing only the strip', () => {
    renderOverview();
    // both section headers are present...
    expect(screen.getByText(/A-B kategória/)).toBeTruthy();
    expect(screen.getByText(/C-D-E kategória/)).toBeTruthy();
    // ...but no section's cards are rendered until expanded
    expect(screen.queryByText('A kettő')).toBeNull();
    expect(screen.queryByText('B egy')).toBeNull();
    expect(screen.queryByText('C egy')).toBeNull();
    // the featured strip is the only visible game list
    expect(screen.getByTestId('featured-strip')).toBeTruthy();
  });

  it('expands a collapsed section when its header is clicked', () => {
    renderOverview();
    expect(screen.queryByText('C egy')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /C-D-E kategória/ }));
    // both games in the C–E+ bracket appear
    expect(screen.getByText('C egy')).toBeTruthy();
    expect(screen.getByText('CD')).toBeTruthy();
  });

  it('filtering force-opens matching sections and hides the rest (and the strip)', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    // C–E+ section force-opened with its matching cards
    expect(screen.getByText('C egy')).toBeTruthy();
    expect(screen.getByText('CD')).toBeTruthy();
    // A–B section gone entirely
    expect(screen.queryByText('A kettő')).toBeNull();
    expect(screen.queryByText('B egy')).toBeNull();
    // no featured game matches C → strip hidden
    expect(screen.queryByTestId('featured-strip')).toBeNull();
  });

  it('remembers a section open state across a remount (navigating to a game and back)', () => {
    const { unmount } = renderOverview();
    // expand the C–E+ section, then leave the overview (unmount)
    fireEvent.click(screen.getByRole('button', { name: /C-D-E kategória/ }));
    expect(screen.getByText('C egy')).toBeTruthy();
    unmount();
    // returning to the overview re-mounts it: the section stays open
    renderOverview();
    expect(screen.getByText('C egy')).toBeTruthy();
  });

  it('remembers a collapsed featured strip across a remount', () => {
    const { unmount } = renderOverview();
    expect(screen.getByText('A egy')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Kiemelt játékok/ }));
    expect(screen.queryByText('A egy')).toBeNull();
    unmount();
    renderOverview();
    expect(screen.queryByText('A egy')).toBeNull();
  });

  it('keeps the filter panel hidden until the funnel toggle is clicked', () => {
    renderOverview();
    // neither the category nor the type toggles are rendered yet...
    expect(screen.queryByRole('button', { name: 'C' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Érmék' })).toBeNull();
    // ...until the header funnel opens the panel, which reveals both rows at once
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    expect(screen.getByRole('button', { name: 'C' })).toBeTruthy();
    // only icons actually in use are offered (coins, piles) — chess is used too
    expect(screen.getByRole('button', { name: 'Érmék' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kupacok' })).toBeTruthy();
  });

  it('narrows the catalog by icon type', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kupacok' })); // piles → only GameCD
    expect(screen.getByText('CD')).toBeTruthy();
    expect(screen.queryByText('C egy')).toBeNull();
    expect(screen.queryByText('A kettő')).toBeNull();
    // GameA1 (featured, chess) doesn't match piles → strip hidden
    expect(screen.queryByTestId('featured-strip')).toBeNull();
  });

  it('combines category and icon filters with AND', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    fireEvent.click(screen.getByRole('button', { name: 'Érmék' })); // coins
    // GameC1 is C + coins → matches; GameCD is C + piles → excluded by icon
    expect(screen.getByText('C egy')).toBeTruthy();
    expect(screen.queryByText('CD')).toBeNull();
  });

  it('keeps filters applied and shows the count after collapsing the panel', () => {
    renderOverview();
    const funnel = screen.getByRole('button', { name: 'Szűrők' });
    fireEvent.click(funnel);
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    // collapse the panel again — the toggles disappear...
    fireEvent.click(funnel);
    expect(screen.queryByRole('button', { name: 'C' })).toBeNull();
    // ...but the filter stays applied (C–E+ cards still shown, A–B still hidden)
    // and the funnel surfaces the active count
    expect(screen.getByText('C egy')).toBeTruthy();
    expect(screen.queryByText('A kettő')).toBeNull();
    expect(within(funnel).getByText('1')).toBeTruthy();
  });

  it('renders the game icon on each card', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: /A-B kategória/ }));
    const card = screen.getByText('A kettő').closest('a');
    expect(card?.querySelector('svg')).toBeTruthy();
  });
});
