import { describe, expect, it } from 'vitest';
import type { Gameplay } from 'engine';
import { applyEvent, createCompetitionMatchState } from './apply-event';
import { toClientView } from './client-view';
import type { CompetitionEvent, CompetitionMatchState } from './types';

type Board = { moved: number }

const gameplay: Gameplay<Board> = {
  moves: {
    pass: { apply: (board) => ({ nextBoard: { moved: board.moved + 1 }, isTurnEnd: true }) }
  }
};

const START_AT = '2026-02-01T10:00:00.000Z';
const NOW = '2026-02-01T10:05:00.000Z';

const play = (
  state: CompetitionMatchState<Board>, ...events: CompetitionEvent<Board>[]
): CompetitionMatchState<Board> =>
  events.reduce((current, event) => {
    const result = applyEvent(current, event, gameplay);
    if (!result.ok) throw new Error(`event ${event.type} rejected: ${result.rejection}`);
    return result.state;
  }, state);

const midGame = () => play(
  createCompetitionMatchState<Board>({ gameId: 'TestGame', category: 'C', startAt: START_AT }),
  { type: 'START_ATTEMPT', at: START_AT, difficulty: 'live', board: { moved: 0 }, startBoardIndex: 0 },
  { type: 'CHOOSE_ROLE', at: START_AT, roleIndex: 0 },
  { type: 'MOVE', at: START_AT, actor: 'team', name: 'pass', args: [] }
);

describe('toClientView', () => {
  it('carries everything the shell renders, plus the server clock', () => {
    const state = midGame();
    expect(toClientView(state, NOW)).toEqual({
      gameId: 'TestGame',
      category: 'C',
      serverNow: NOW,
      clock: state.clock,
      tally: state.tally,
      attempt: {
        difficulty: 'live',
        roleIndex: 0,
        core: {
          board: { moved: 1 },
          phase: 'play',
          currentPlayer: 1,
          chosenRoleIndex: 0,
          turnState: null,
          moveCount: 1,
          winnerIndex: null
        }
      },
      finished: false
    });
  });

  it('ships no host bookkeeping — asserted against the state, so a new internal cannot leak by default', () => {
    const state = midGame();
    const view = toClientView(state, NOW);
    expect(Object.keys(view).sort())
      .toEqual(['attempt', 'category', 'clock', 'finished', 'gameId', 'serverNow', 'tally']);
    expect(Object.keys(view.attempt!).sort()).toEqual(['core', 'difficulty', 'roleIndex']);
    // undoSnapshot (a second board copy), currentTurnHasMoves and mode are the
    // engine host's own; startBoardIndex is hand-out bookkeeping.
    expect(Object.keys(view.attempt!.core).sort()).toEqual(
      ['board', 'chosenRoleIndex', 'currentPlayer', 'moveCount', 'phase', 'turnState', 'winnerIndex']
    );
  });

  it('passes a between-attempts state through with attempt null', () => {
    const state = createCompetitionMatchState<Board>({
      gameId: 'TestGame', category: 'C', startAt: START_AT
    });
    expect(toClientView(state, NOW).attempt).toBeNull();
  });

  it('survives a JSON round-trip, being what an HTTP body carries', () => {
    const view = toClientView(midGame(), NOW);
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
  });
});
