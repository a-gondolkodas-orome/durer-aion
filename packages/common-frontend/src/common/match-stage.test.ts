import { GUESSER_PLAYER, JUDGE_PLAYER, PHASE } from 'game';
import type { GameStateMixin } from 'game';
import { boardState, chosenRole, matchStage } from './match-stage';

function state(game: Partial<GameStateMixin> = {}): GameStateMixin {
  return {
    millisecondsRemaining: 0,
    start: '',
    end: '',
    firstPlayer: null,
    difficulty: 'live',
    winner: null,
    numberOfTries: 1,
    numberOfLoss: 0,
    winningStreak: 0,
    points: 0,
    liveResults: [],
    ...game,
  };
}

const team = { currentPlayer: GUESSER_PLAYER };
const bot = { currentPlayer: JUDGE_PLAYER };

describe('matchStage', () => {
  test('a second live win in a row ends the match as won, whatever the phase', () => {
    expect(matchStage(state({ winningStreak: 2 }), { phase: PHASE.startNewGame, ...team }, true))
      .toStrictEqual({ kind: 'ended', by: 'liveWon' });
  });

  test('the clock ending a match says whether it cut a game short', () => {
    expect(matchStage(state(), { phase: PHASE.play, ...team }, true)).toStrictEqual({ kind: 'ended', by: 'time', unfinished: true });
    expect(matchStage(state(), { phase: PHASE.chooseRole, ...team }, true)).toStrictEqual({ kind: 'ended', by: 'time', unfinished: true });
    expect(matchStage(state(), { phase: PHASE.startNewGame, ...team }, true)).toStrictEqual({ kind: 'ended', by: 'time', unfinished: false });
  });

  // The state's type allows `undefined` as well as `null` for no mode.
  test('with no mode ever chosen, the intro', () => {
    expect(matchStage(state({ difficulty: null }), { phase: PHASE.startNewGame, ...team }, false)).toStrictEqual({ kind: 'intro', teamToMove: true });
    expect(matchStage(state({ difficulty: undefined }), { phase: PHASE.startNewGame, ...team }, false)).toStrictEqual({ kind: 'intro', teamToMove: true });
  });

  test('between games, the last result, until the bot is placing the next opening', () => {
    expect(matchStage(state({ difficulty: 'test', winner: GUESSER_PLAYER }), { phase: PHASE.startNewGame, ...team }, false))
      .toStrictEqual({ kind: 'result', teamToMove: true, practice: true, won: true });
    expect(matchStage(state({ difficulty: 'live', winner: JUDGE_PLAYER }), { phase: PHASE.startNewGame, ...team }, false))
      .toStrictEqual({ kind: 'result', teamToMove: true, practice: false, won: false });
    expect(matchStage(state({ difficulty: 'live', winner: JUDGE_PLAYER }), { phase: PHASE.startNewGame, ...bot }, false))
      .toStrictEqual({ kind: 'nextGame', teamToMove: false });
    expect(matchStage(state({ difficulty: 'live', winner: null }), { phase: PHASE.startNewGame, ...team }, false))
      .toStrictEqual({ kind: 'nextGame', teamToMove: true });
  });

  test('in a game, whose turn it is', () => {
    expect(matchStage(state(), { phase: PHASE.chooseRole, ...team }, false)).toStrictEqual({ kind: 'chooseRole', teamToMove: true });
    expect(matchStage(state(), { phase: PHASE.play, ...team }, false)).toStrictEqual({ kind: 'play', teamToMove: true });
    expect(matchStage(state(), { phase: PHASE.play, ...bot }, false)).toStrictEqual({ kind: 'play', teamToMove: false });
  });

  test('a stuck bot, in a game or placing its opening, until the clock ends the match', () => {
    expect(matchStage(state({ botStuck: true }), { phase: PHASE.play, ...bot }, false)).toStrictEqual({ kind: 'stuck' });
    expect(matchStage(state({ botStuck: true }), { phase: PHASE.startNewGame, ...bot }, false)).toStrictEqual({ kind: 'stuck' });
    expect(matchStage(state({ botStuck: true }), { phase: PHASE.play, ...bot }, true)).toStrictEqual({ kind: 'ended', by: 'time', unfinished: true });
  });
});

test('the board is live on the team\'s turn and shows a position it may not move on locked', () => {
  expect(boardState({ kind: 'play', teamToMove: true })).toBe('live');
  expect(boardState({ kind: 'play', teamToMove: false })).toBe('waiting');
  expect(boardState({ kind: 'chooseRole', teamToMove: true })).toBe('locked');
  expect(boardState({ kind: 'result', teamToMove: true, practice: true, won: false })).toBe('locked');
  expect(boardState({ kind: 'ended', by: 'time', unfinished: true })).toBe('locked');
  expect(boardState({ kind: 'nextGame', teamToMove: false })).toBe('empty');
  expect(boardState({ kind: 'intro', teamToMove: true })).toBe('empty');
});

test('the role chip shows only while a game is played', () => {
  const labels = ['first', 'second'] as const;
  expect(chosenRole({ kind: 'play', teamToMove: true }, { firstPlayer: GUESSER_PLAYER }, labels)).toBe('first');
  expect(chosenRole({ kind: 'play', teamToMove: false }, { firstPlayer: JUDGE_PLAYER }, labels)).toBe('second');
  expect(chosenRole({ kind: 'chooseRole', teamToMove: true }, { firstPlayer: GUESSER_PLAYER }, labels)).toBeNull();
  expect(chosenRole({ kind: 'ended', by: 'time', unfinished: true }, { firstPlayer: GUESSER_PLAYER }, labels)).toBeNull();
});
