import type { Game } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { botWrapper } from './botwrapper';
import { gameWrapper } from './gamewrapper';
import { GUESSER_PLAYER, JUDGE_PLAYER } from './types';
import { MyGameWrapper as Ketkupac } from '../games/strategy/ketkupac/game';
import { strategyWrapper as ketkupacBot } from '../games/strategy/ketkupac/strategy';
import { MyGameWrapper as TwentyOCDE } from '../games/strategy/20ocde/game';
import { strategyWrapper as twentyOCDEBot } from '../games/strategy/20ocde/strategy';

// The dry run's host: boardgame.io's `Local` asks again after each of the bot's
// moves while the turn is the bot's, so a turn of two moves lands move by move.
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

  test('a turn of a choice, then a take', async () => {
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

  test('a turn of two X\'s', async () => {
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
