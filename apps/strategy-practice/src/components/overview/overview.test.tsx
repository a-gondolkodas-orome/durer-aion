// @vitest-environment jsdom
import { render, screen, within, fireEvent } from '@testing-library/react';
import { Overview } from './overview';
import type { Category, GameList, IconKey } from '../games/gameList';
import { HashRouter } from 'react-router';
import i18next from 'i18next';

interface CanonicalConstants { iconKeys: readonly IconKey[]; categories: readonly Category[] }

vi.mock('../games/gameList', async (importOriginal): Promise<CanonicalConstants & { gameList: GameList }> => ({
  ...(await importOriginal<CanonicalConstants>()),
  gameList: {
    GameA1: {
      category: ['A'],
      year: { k: '', v: '11/12' },
      round: 'döntő',
      featured: true,
      icon: 'chess'
    },
    GameA2: { category: ['A'], year: { k: '', v: '12/13' }, round: 'döntő', icon: 'number' },
    GameB1: { category: ['B'], year: { k: '', v: '13/14' }, round: 'döntő', icon: 'number' },
    GameC1: { category: ['C'], year: { k: '', v: '14/15' }, round: 'online', icon: 'coins' },
    GameCD: { category: ['C', 'D'], year: { k: '', v: '15/16' }, round: 'döntő', icon: 'piles' }
  }
}));

// The mocked games' names, where the real ones live: the catalog namespace.
i18next.addResourceBundle('hu', 'catalog', {
  GameA1: { name: 'A egy' },
  GameA2: { name: 'A kettő' },
  GameB1: { name: 'B egy' },
  GameC1: { name: 'C egy' },
  GameCD: { name: 'CD' }
}, true);

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
    expect(screen.getByRole('checkbox', { name: '11/12' }).getAttribute('title')).toBe('11/12');
    // only icons actually in use are offered (coins, piles) — chess is used too
    expect(screen.getByRole('button', { name: 'Érmék' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kupacok' })).toBeTruthy();
  });

  it('filters by selected years using timeline checkboxes', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    const year = screen.getByRole('checkbox', { name: '14/15' });
    expect(year.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(year);
    expect(year.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('C egy')).toBeTruthy();
    expect(screen.queryByText('A kettő')).toBeNull();
    expect(screen.queryByText('B egy')).toBeNull();
  });

  it('selects years while dragging across timeline checkboxes', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    const first = screen.getByRole('checkbox', { name: '11/12' });
    const second = screen.getByRole('checkbox', { name: '12/13' });
    fireEvent.pointerDown(first);
    fireEvent.pointerEnter(second);
    fireEvent.pointerUp(second);
    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(second.getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByText('B egy')).toBeNull();
  });

  it('selects years from pointer movement on the timeline', () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Szűrők' }));
    const first = screen.getByRole('checkbox', { name: '11/12' });
    const second = screen.getByRole('checkbox', { name: '12/13' });
    const timeline = first.parentElement?.parentElement;
    expect(timeline).toBeTruthy();
    Object.defineProperty(timeline, 'setPointerCapture', { value: vi.fn() });
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: vi.fn().mockReturnValue([second])
    });
    fireEvent.pointerDown(first, { pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(timeline!, { clientX: 35, clientY: 0, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(timeline!, { pointerId: 1, pointerType: 'touch' });
    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(second.getAttribute('aria-checked')).toBe('true');
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
