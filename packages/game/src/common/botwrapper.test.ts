import type { Ctx, Game, State } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { botWrapper } from './botwrapper';
import type { BotTurn } from './botwrapper';
import { gameWrapper, PHASE } from './gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from './types';
import { MyGameWrapper as Ketkupac } from '../games/strategy/ketkupac/game';
import { strategyWrapper as ketkupacBot } from '../games/strategy/ketkupac/strategy';
import { MyGameWrapper as TwentyOCDE } from '../games/strategy/20ocde/game';
import { strategyWrapper as twentyOCDEBot } from '../games/strategy/20ocde/strategy';

// boardgame.io's Bot takes an enumerate function, which this wrapper never calls.
const enumerate = () => [];

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

const playFrom = async (bot: ReturnType<typeof botFor>['bot'], stateID: number, turn = 1) =>
  (await bot.play(stateAt(stateID, turn), JUDGE_PLAYER)).action;

describe('a bot\'s turn', () => {
  test('is the one move a strategy names', async () => {
    expect(named([await playFrom(botFor([[1], 'a']).bot, 0)])).toStrictEqual([[[1], 'a']]);
  });

  test('fails aloud when the strategy names no move', async () => {
    await expect(playFrom(botFor([]).bot, 0)).rejects.toThrow('named no move');
  });
});

describe('a bot asked one move at a time', () => {
  test('goes on with its plan from the state its last move made', async () => {
    const { bot, strategy } = botFor([[[1], 'a'], [[2], 'b'], [[3], 'c']]);
    const moves = [];
    for (const stateID of [4, 5, 6]) moves.push(await playFrom(bot, stateID));
    expect(named(moves as never)).toStrictEqual([[[1], 'a'], [[2], 'b'], [[3], 'c']]);
    expect(strategy).toHaveBeenCalledTimes(1);
    expect(bot.movesLeft()).toBe(0);
  });

  // The strategy practice site's coins-in-3-piles: taking a coin is the whole
  // turn or its first half, and the second half may be a move with no arguments.
  test('plays a turn as long as its strategy names, a move with no arguments too', async () => {
    const twoHalves = botFor([[[3], 'removeCoin'], [[], 'passAddition']]).bot;
    expect(named([await playFrom(twoHalves, 4), await playFrom(twoHalves, 5)] as never))
      .toStrictEqual([[[3], 'removeCoin'], [[], 'passAddition']]);

    const oneHalf = botFor([[[1], 'removeCoin']]).bot;
    expect(named([await playFrom(oneHalf, 4)] as never)).toStrictEqual([[[1], 'removeCoin']]);
    expect(oneHalf.movesLeft()).toBe(0);
  });

  test('plans afresh from any other state', async () => {
    const { bot, strategy } = botFor([[[1], 'a'], [[2], 'b']]);
    await playFrom(bot, 4);
    expect(bot.movesLeft()).toBe(1);
    // Its first move was refused, so the state is the one it planned from.
    expect(named([await playFrom(bot, 4) as never])).toStrictEqual([[[1], 'a']]);
    // A later turn that happens to reach the state ID its plan expected.
    expect(named([await playFrom(bot, 5, 2) as never])).toStrictEqual([[[1], 'a']]);
    expect(strategy).toHaveBeenCalledTimes(3);
  });
});

// The dry run's host: boardgame.io's `Local` asks again after each of the bot's
// moves while the turn is the bot's, so a turn lands move by move, whether its
// strategy names one move at a time or the whole turn.
describe('in the browser', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function dryRun(game: Game, bot: ReturnType<typeof botWrapper>) {
    const client = Client({
      game,
      numPlayers: 2,
      playerID: GUESSER_PLAYER,
      multiplayer: Local({ bots: { [JUDGE_PLAYER]: bot } }),
    });
    client.start();
    const botMoves = () => (client.getState()?.log ?? [])
      .filter(({ action }) => action.payload.playerID === JUDGE_PLAYER && action.type === 'MAKE_MOVE')
      .map(({ action: { payload } }) => payload.type);
    return { client, botMoves };
  }

  test('a turn named one move at a time', async () => {
    const { client, botMoves } = dryRun(gameWrapper(Ketkupac()), botWrapper(ketkupacBot()));

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
  });

  test('a turn named as a whole', async () => {
    // Category E: the team, choosing to start, plays O; the bot its two X's.
    const { client, botMoves } = dryRun(gameWrapper(TwentyOCDE('E')), botWrapper(twentyOCDEBot('E')));

    client.moves.chooseNewGameType('live');
    await vi.advanceTimersByTimeAsync(1000);
    client.moves.chooseRole(GUESSER_PLAYER);
    client.moves.placeMark(12);
    await vi.advanceTimersByTimeAsync(2000);

    expect(botMoves()).toStrictEqual(['setStartingPosition', 'placeMark', 'placeMark']);
    expect(client.getState()?.ctx.currentPlayer).toBe(GUESSER_PLAYER);
    expect(client.getState()?.G.cells.filter((cell: unknown) => cell === 'X')).toHaveLength(2);
    client.stop();
  });
});
