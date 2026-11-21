import type { Ctx, State } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { botWrapper } from './botwrapper';
import type { BotTurn } from './botwrapper';
import { gameWrapper, PHASE } from './gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from './types';
import { MyGameWrapper as Ketkupac } from '../games/strategy/ketkupac/game';
import { strategyWrapper as ketkupacBot } from '../games/strategy/ketkupac/strategy';

const enumerate = () => [{ move: 'random', args: [] }];

function botFor(turn: BotTurn<number[]>) {
  const strategy = vi.fn(() => turn);
  const bot = new (botWrapper(strategy))({ enumerate });
  bot.wait = () => Promise.resolve();
  return { bot, strategy };
}

const named = (actions: { payload: { type: string; args?: unknown } }[]) =>
  actions.map(({ payload: { type, args } }) => [args, type]);

function stateAt(_stateID: number, turn = 1): State {
  return { G: {}, ctx: { turn, phase: PHASE.play, currentPlayer: JUDGE_PLAYER } as Ctx, _stateID } as State;
}

describe('a bot\'s plan of its turn', () => {
  test('is the one move a strategy names, or its several in order', () => {
    expect(named(botFor([[1], 'a']).bot.planTurn(stateAt(0), JUDGE_PLAYER))).toStrictEqual([[[1], 'a']]);
    expect(named(botFor([[[1], 'a'], [[2], 'b']]).bot.planTurn(stateAt(0), JUDGE_PLAYER)))
      .toStrictEqual([[[1], 'a'], [[2], 'b']]);
  });

  test('picks a random move for an undefined one, and for none at all', () => {
    expect(named(botFor([undefined, 'a']).bot.planTurn(stateAt(0), JUDGE_PLAYER))).toStrictEqual([[[], 'random']]);
    expect(named(botFor([]).bot.planTurn(stateAt(0), JUDGE_PLAYER))).toStrictEqual([[[], 'random']]);
  });
});

describe('a bot asked one move at a time', () => {
  test('goes on with its plan from the state its last move made', async () => {
    const { bot, strategy } = botFor([[[1], 'a'], [[2], 'b'], [[3], 'c']]);
    const moves = [];
    for (const stateID of [4, 5, 6]) moves.push((await bot.play(stateAt(stateID), JUDGE_PLAYER)).action);
    expect(named(moves as never)).toStrictEqual([[[1], 'a'], [[2], 'b'], [[3], 'c']]);
    expect(strategy).toHaveBeenCalledTimes(1);
  });

  test('plans afresh from any other state', async () => {
    const { bot, strategy } = botFor([[[1], 'a'], [[2], 'b']]);
    await bot.play(stateAt(4), JUDGE_PLAYER);
    // Its first move was refused, so the state is the one it planned from.
    expect(named([(await bot.play(stateAt(4), JUDGE_PLAYER)).action as never])).toStrictEqual([[[1], 'a']]);
    // A later turn that happens to reach the state ID its plan expected.
    expect(named([(await bot.play(stateAt(5, 2), JUDGE_PLAYER)).action as never])).toStrictEqual([[[1], 'a']]);
    expect(strategy).toHaveBeenCalledTimes(3);
  });
});

// The dry run's host: boardgame.io's `Local` asks again after each of the bot's
// moves while the turn is the bot's, so a turn named as two moves lands as two.
test('a turn named as two moves is played as two in the browser', async () => {
  vi.useFakeTimers();
  const client = Client({
    game: gameWrapper(Ketkupac()),
    numPlayers: 2,
    playerID: GUESSER_PLAYER,
    multiplayer: Local({ bots: { [JUDGE_PLAYER]: botWrapper(ketkupacBot()) } }),
  });
  client.start();
  const botMoves = () => (client.getState()?.log ?? [])
    .filter(({ action }) => action.payload.playerID === JUDGE_PLAYER && action.type === 'MAKE_MOVE')
    .map(({ action: { payload } }) => payload.type);

  client.moves.chooseNewGameType('test');
  await vi.advanceTimersByTimeAsync(1000);
  client.moves.chooseRole(GUESSER_PLAYER);
  client.moves.selectPile(0);
  client.moves.take(0, 1);
  await vi.advanceTimersByTimeAsync(2000);

  expect(botMoves()).toStrictEqual(['setStartingPosition', 'selectPile', 'take']);
  expect(client.getState()?.ctx.currentPlayer).toBe(GUESSER_PLAYER);
  expect(client.getState()?.G.selectedPile).toBeNull();
  client.stop();
  vi.useRealTimers();
});
