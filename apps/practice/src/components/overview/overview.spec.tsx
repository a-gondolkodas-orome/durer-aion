// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { Overview } from './overview';
import { gameList, type GameList } from '../games/gameList';
import { HashRouter } from 'react-router';

vi.mock('../games/gameList', (): { gameList: GameList } => ({
  gameList: {
    GameA: { name: { hu: 'A játék' }, category: ['A'], year: { k: 'I. (07/08)', v: '07/08' }, round: 'döntő' },
    GameB: { name: { hu: 'B játék' }, category: ['B'], year: { k: 'II. (08/09)', v: '08/09' }, round: 'döntő' },
    GameC: { name: { hu: 'C játék' }, category: ['C'], year: { k: 'III. (09/10)', v: '09/10' }, round: 'online' }
  }
}));

describe('Overview', () => {
  it('should show a list of available games', async () => {
    const { getAllByTestId } = render(<HashRouter><Overview /></HashRouter>);

    expect(getAllByTestId('game-card')).toHaveLength(Object.values(gameList).length);
  });
});
