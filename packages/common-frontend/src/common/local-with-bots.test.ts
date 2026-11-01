// @vitest-environment jsdom
//
// The bug this pins is a match that comes back from localStorage with the bot
// to move (issue #133), so these run against a real `Local` transport and a
// real localStorage rather than a stub of either. What stands in for a page
// reload is a second client built on a *different game object*: boardgame.io
// keys its local masters by that object, so a new one is a fresh master reading
// the storage the old one wrote — which is what a reload is.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Bot } from 'boardgame.io/ai';
import type { Ctx, Game, State } from 'boardgame.io';
import { localWithBots } from './local-with-bots';

const MATCH_ID = 'match-under-test';

interface TestState {
  marks: string[];
}

/// Two players, one move each turn, so a player's move hands the turn over.
const testGame: Game<TestState> = {
  name: 'local-with-bots-test',
  setup: () => ({ marks: [] }),
  turn: { minMoves: 1, maxMoves: 1 },
  moves: {
    mark: ({ G }, who: string) => { G.marks.push(who); },
  },
  ai: { enumerate: () => [{ move: 'mark', args: ['bot'] }] },
};

/// A bot that answers with one `mark`, and counts how often it was asked.
/// `beforePlay` is where a test holds it up: the one that never resolves leaves
/// the match saved on the bot's turn, which is the state under test.
function botThatMarks(plays: { count: number }, beforePlay?: () => Promise<void>) {
  return class extends Bot {
    async play(_state: State<TestState>, playerID: string): ReturnType<Bot['play']> {
      plays.count += 1;
      if (beforePlay) {
        await beforePlay();
      }
      return { action: { type: 'MAKE_MOVE', payload: { type: 'mark', args: ['bot'], playerID } } };
    }
  };
}

const neverAnswers = () => new Promise<void>(() => undefined);

const transportFor = (storageKey: string, bot: ReturnType<typeof botThatMarks>) =>
  localWithBots({ bots: { '1': bot }, storageKey });

function clientPlaying(game: Game<TestState>, multiplayer: ReturnType<typeof transportFor>) {
  return Client<TestState>({
    game,
    numPlayers: 2,
    playerID: '0',
    matchID: MATCH_ID,
    multiplayer,
  });
}

/// boardgame.io waits 100ms before it lets a bot play, so nothing here is
/// finished until the clock has moved.
const letTheBotPlay = () => vi.advanceTimersByTimeAsync(200);

const stateOf = (client: ReturnType<typeof clientPlaying>) =>
  client.getState() as unknown as { G: TestState, ctx: Ctx };

describe('a match restored with the bot to move', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /// The regression: before the fix, the reloaded client sat on the bot's turn
  /// for good, because boardgame.io only asks a local bot to play in answer to
  /// a move — never for a match it restores.
  test('is played on, not left for the bot to never answer', async () => {
    const storageKey = 'resumes';
    const interrupted = { count: 0 };
    // The first client's bot never answers, so what it saves is a match whose
    // turn belongs to a bot that will not take it.
    const before = clientPlaying({ ...testGame }, transportFor(storageKey, botThatMarks(interrupted, neverAnswers)));
    before.start();
    before.moves.mark('human');
    await letTheBotPlay();
    expect(stateOf(before).ctx.currentPlayer).toStrictEqual('1');
    before.stop();

    const plays = { count: 0 };
    const afterReload = clientPlaying({ ...testGame }, transportFor(storageKey, botThatMarks(plays)));
    afterReload.start();
    await letTheBotPlay();

    expect(stateOf(afterReload).G.marks).toStrictEqual(['human', 'bot']);
    expect(stateOf(afterReload).ctx.currentPlayer).toStrictEqual('0');
    afterReload.stop();
  });

  test('is left alone when the turn is the team\'s', async () => {
    const storageKey = 'not-the-bots-turn';
    const before = clientPlaying({ ...testGame }, transportFor(storageKey, botThatMarks({ count: 0 }, neverAnswers)));
    before.start();
    before.stop();

    const plays = { count: 0 };
    const afterReload = clientPlaying({ ...testGame }, transportFor(storageKey, botThatMarks(plays)));
    afterReload.start();
    await letTheBotPlay();

    expect(plays.count).toStrictEqual(0);
    expect(stateOf(afterReload).G.marks).toStrictEqual([]);
    afterReload.stop();
  });
});
