// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import type { BoardProps } from 'boardgame.io/react';
import { PHASE } from '../../../common/gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { MyBoard } from './board';
import type { MyGameState } from './game';

type Props = BoardProps<MyGameState & GameStateMixin>;

function showBoard(G: Partial<MyGameState & GameStateMixin>, ctx: Partial<Props['ctx']>, isActive: boolean) {
  const props = {
    G: { piles: [3, 6], selectedPile: 1, lastJudgeTake: null, winner: null, ...G },
    ctx: { phase: PHASE.play, currentPlayer: JUDGE_PLAYER, ...ctx },
    moves: {},
    isActive,
  } as unknown as Props;
  render(<MyBoard {...props}/>);
  return screen.getAllByRole('button').map(button => button.getAttribute('aria-pressed'));
}

afterEach(cleanup);

describe('the two-pile board', () => {
  test('shows the pile the bot chose, between the two moves of its turn', () => {
    expect(showBoard({}, {}, false)).toStrictEqual(['false', 'true']);
  });

  // A game the time ran out in ends with `endGame`, in the play phase, and
  // keeps the pile the team had chosen.
  test('shows no chosen pile once the game is over', () => {
    expect(showBoard({}, { currentPlayer: GUESSER_PLAYER, gameover: true }, false)).toStrictEqual(['false', 'false']);
  });
});

test('a pile chosen, the keyboard goes on to how many to take from it', async () => {
  showBoard({ firstPlayer: GUESSER_PLAYER }, { currentPlayer: GUESSER_PLAYER }, true);
  // The focus ripple MUI starts on the button settles after the render.
  await act(() => Promise.resolve());
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '1 korong elvétele' }));
});
