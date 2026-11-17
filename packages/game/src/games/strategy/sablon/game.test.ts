import type { Ctx } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { gameWrapper, PHASE } from '../../../common/gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { isLegalTake, MyGameWrapper, OPENING_RANGE, possibleMoves, startingPosition } from './game';
import type { MyGameState } from './game';
import { OUTCOME_BY_REMAINDER, randomOpening, strategyWrapper, wins } from './strategy';

type State = MyGameState & GameStateMixin;

function playing(pile: number, currentPlayer = GUESSER_PLAYER): { G: State, ctx: Ctx } {
  const G = { ...startingPosition(pile), firstPlayer: GUESSER_PLAYER, winner: null, difficulty: 'live',
    winningStreak: 0, numberOfLoss: 0, points: 0 } as unknown as State;
  return { G, ctx: { phase: PHASE.play, currentPlayer } as Ctx };
}

function take({ G, ctx }: { G: State, ctx: Ctx }, count: unknown) {
  const events = { endTurn: vi.fn(), endGame: vi.fn() };
  const fn = MyGameWrapper().moves?.take as (context: unknown, count: unknown) => unknown;
  return { result: fn({ G, ctx, events }, count), events };
}

describe('the template game\'s take', () => {
  test('takes 1, 3 or 4, never more than the pile', () => {
    const { G, ctx } = playing(3);
    expect([0, 1, 2, 3, 4, 1.5, '1'].map(count => isLegalTake(G, ctx, count))).toStrictEqual([false, true, false, true, false, false, false]);
    expect(possibleMoves(G, ctx)).toStrictEqual([{ move: 'take', args: [1] }, { move: 'take', args: [3] }]);
  });

  test('refuses a take before the roles are chosen', () => {
    const { G, ctx } = playing(10);
    G.firstPlayer = null;
    expect(take({ G, ctx }, 1).result).toBe('INVALID_MOVE');
  });

  test('gives the game to whoever takes the last token', () => {
    const state = playing(4, JUDGE_PLAYER);
    take(state, 4);
    expect(state.G.winner).toBe(JUDGE_PLAYER);
    expect(state.G.numberOfLoss).toBe(1);
    expect(state.G.lastJudgeTake).toBe(4);
  });
});

// Through the wrapper, as a match runs: the move ends the turn itself, once.
test('a take passes the turn to the other player, and only to them', () => {
  const client = Client({ game: gameWrapper(MyGameWrapper()), numPlayers: 2 });
  client.start();
  client.moves.chooseNewGameType('test');
  client.moves.setStartingPosition(startingPosition(12));
  client.moves.chooseRole(GUESSER_PLAYER);
  expect(client.getState()?.ctx.phase).toBe(PHASE.play);

  for (const [player, next] of [[GUESSER_PLAYER, JUDGE_PLAYER], [JUDGE_PLAYER, GUESSER_PLAYER], [GUESSER_PLAYER, JUDGE_PLAYER]]) {
    expect(client.getState()?.ctx.currentPlayer).toBe(player);
    client.moves.take(1);
    expect(client.getState()?.ctx.currentPlayer).toBe(next);
  }
  expect(client.getState()?.G.pile).toBe(9);
  client.stop();
});

describe('the template game\'s bot', () => {
  test('has a table that agrees with the search', () => {
    for (let pile = 0; pile < 40; pile++) {
      expect(OUTCOME_BY_REMAINDER[`sablon-maradek-${pile % 7}`]).toBe(wins(pile));
    }
  });

  test('leaves a lost pile whenever there is one', () => {
    for (let pile = 1; pile <= OPENING_RANGE.max; pile++) {
      const state = playing(pile, JUDGE_PLAYER);
      const [[count], name] = strategyWrapper()(state as never, JUDGE_PLAYER) as [[number], string];
      expect(name).toBe('take');
      expect(isLegalTake(state.G, state.ctx, count)).toBe(true);
      if (wins(pile)) expect(wins(pile - count)).toBe(false);
    }
  });

  test('draws the opening pile within its range', () => {
    const piles = new Set(Array.from({ length: 300 }, () => randomOpening().pile));
    expect(Math.min(...piles)).toBe(OPENING_RANGE.min);
    expect(Math.max(...piles)).toBe(OPENING_RANGE.max);
  });
});
