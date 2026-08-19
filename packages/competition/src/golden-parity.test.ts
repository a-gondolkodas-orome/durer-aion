import { describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import type { Gameplay } from 'engine';
// The oracle is the still-installed old implementation, reached by path
// because it is exactly the code being replaced — these imports and this spec
// are deleted with it in Phase 7.2. The stub game carries the scoring ladder
// inside its win move, mirroring where the real games keep their copies.
import { gameWrapper } from '../../game/src/common/gamewrapper';
import { createGameWithoutStartingPosition } from '../../game/src/common/game_for_testing';
import { applyEvent, createCompetitionMatchState } from './apply-event';
import type { CompetitionEvent, CompetitionMatchState } from './types';

type Step = { difficulty: 'test' | 'live'; teamWins: boolean }

const win: Step = { difficulty: 'live', teamWins: true };
const loss: Step = { difficulty: 'live', teamWins: false };
const testWin: Step = { difficulty: 'test', teamWins: true };
const testLoss: Step = { difficulty: 'test', teamWins: false };

type Outcome = {
  tries: number
  losses: number
  streak: number
  points: number
  finished: boolean
}

// One scripted competition through the old gameWrapper, exactly as its own
// suite drives it: a headless boardgame.io Client playing the stub game whose
// win/lose moves carry the ladder.
const throughOldGameWrapper = (steps: Step[]): Outcome => {
  const wrappedGame = gameWrapper(createGameWithoutStartingPosition(() => ({ data: 'board' })));
  const client = Client({ game: wrappedGame, numPlayers: 2 });
  client.start();
  for (const step of steps) {
    client.moves.chooseNewGameType(step.difficulty);
    client.moves.setStartingPosition({ data: 'board' });
    client.moves.chooseRole('0');
    if (step.teamWins) client.moves.win();
    else client.moves.lose();
  }
  const state = client.getState()!;
  return {
    tries: state.G.numberOfTries,
    losses: state.G.numberOfLoss,
    streak: state.G.winningStreak,
    points: state.G.points,
    finished: state.ctx.phase === null
  };
};

type Board = { data: string }

const gameplay: Gameplay<Board> = {
  moves: {
    resolve: {
      apply: (board, _: unknown, winnerIndex: number) => ({ nextBoard: board, gameEnd: { winnerIndex } })
    }
  }
};

const START_AT = '2026-02-01T10:00:00.000Z';

// The same script through applyEvent. The team sits in seat 0 and one move
// decides each game, matching the stub's win/lose.
const throughApplyEvent = (steps: Step[]): Outcome => {
  let state: CompetitionMatchState<Board> = createCompetitionMatchState({
    gameId: 'StubGame', category: 'C', startAt: START_AT
  });
  const apply = (event: CompetitionEvent<Board>) => {
    const result = applyEvent(state, event, gameplay);
    if (!result.ok) throw new Error(`${event.type} rejected: ${result.rejection}`);
    state = result.state;
  };
  for (const step of steps) {
    apply({ type: 'START_ATTEMPT', at: START_AT, difficulty: step.difficulty, board: { data: 'board' } });
    apply({ type: 'CHOOSE_ROLE', at: START_AT, roleIndex: 0 });
    apply({ type: 'MOVE', at: START_AT, actor: 'team', name: 'resolve', args: [step.teamWins ? 0 : 1] });
  }
  return { ...state.tally, finished: state.finished };
};

// Every sequence a competition can score differently: straight double win,
// the whole ladder of prior losses, streaks broken late, test games woven in
// (they must move nothing), and matches that never finish.
const SCRIPTS: [string, Step[]][] = [
  ['two straight wins', [win, win]],
  ['a loss, then the double win', [loss, win, win]],
  ['two losses first', [loss, loss, win, win]],
  ['three losses first', [loss, loss, loss, win, win]],
  ['four losses first', [loss, loss, loss, loss, win, win]],
  ['five losses first', [loss, loss, loss, loss, loss, win, win]],
  ['seven losses first — the ladder floors', [loss, loss, loss, loss, loss, loss, loss, win, win]],
  ['a win whose streak a loss breaks', [win, loss, win, win]],
  ['streak broken twice', [win, loss, win, loss, win, win]],
  ['test games woven through', [testWin, loss, testLoss, win, testWin, win]],
  ['losses only, never finished', [loss, loss, loss]],
  ['a single win, still open', [win]],
  ['test games only', [testWin, testLoss, testWin]]
];

describe('applyEvent scores exactly as the old gameWrapper', () => {
  it.each(SCRIPTS)('%s', (_name, steps) => {
    expect(throughApplyEvent(steps)).toEqual(throughOldGameWrapper(steps));
  });
});
