// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, JUDGE_PLAYER } from 'game';
import type { GameStateMixin } from 'game';
import { ClientRepoProvider } from '../client/client-repo-context';
import { MockClientRepository } from '../client/mock-client-repository';
import { MockTeamState } from '../client/hooks/mock-user-hooks';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoardProps, StrategyDescription } from './boardwrapper';

const i18n = vi.hoisted(() => ({ language: 'hu' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n }),
}));
vi.mock('../client/hooks/user-hooks', () => MockTeamState.mockHook);

afterEach(() => {
  i18n.language = 'hu';
});

const play = vi.fn();
// A board with one control, to see whether a click on it gets through.
const cellBoard = () => <button data-testid="cell" onClick={play}>cell</button>;
const Board = boardWrapper<object>(cellBoard, <p>the rules</p>, {});
// A game that names its roles, and whose opening position varies.
const NamedBoard = boardWrapper<object>(cellBoard, <p>the rules</p>, {
  roleLabels: ['Kezdünk (1 O)', 'Másodikak leszünk (2 X)'], startVaries: true,
});

const clientRepo = new MockClientRepository();

/// Only the fields the wrapper reads; boardgame.io hands a board plenty more.
function boardElement(ctx: Partial<Ctx>, game: Partial<GameStateMixin> & Record<string, unknown> = {}, Wrapped = Board) {
  const G: GameStateMixin = {
    millisecondsRemaining: 10 * 60 * 1000,
    start: new Date().toISOString(),
    end: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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
  const moves = { getTime: vi.fn(), chooseNewGameType: vi.fn(), chooseRole: vi.fn() };
  const props = {
    G,
    ctx: { numPlayers: 2, playOrder: ['0', '1'], playOrderPos: 0, activePlayers: null, turn: 1, ...ctx },
    moves,
  } as unknown as StrategyBoardProps<object>;
  return { moves, element: <ClientRepoProvider value={clientRepo}><Wrapped {...props} /></ClientRepoProvider> };
}

function renderBoard(ctx: Partial<Ctx>, game: Partial<GameStateMixin> & Record<string, unknown> = {}, Wrapped = Board) {
  const { moves, element } = boardElement(ctx, game, Wrapped);
  render(element);
  return moves;
}

const status = () => screen.getByRole('status');
const boardArea = () => screen.getByTestId('strategyBoard');
const button = (name: string) => screen.getByRole('button', { name });
const betweenGames = { phase: 'startNewGame', currentPlayer: GUESSER_PLAYER };

describe('before the first game', () => {
  test('shows the rules first, which only the team\'s word closes, then the two kinds of game', async () => {
    const moves = renderBoard(betweenGames, { difficulty: null, numberOfTries: 0 });

    expect(screen.getByRole('dialog')).toHaveTextContent('strategy.rulesFirst.title');
    expect(screen.getByRole('dialog')).toHaveTextContent('the rules');
    // What every game shares, after the game's own rules.
    expect(screen.getByRole('dialog')).toHaveTextContent('strategy.rulesCommon');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(button('strategy.rulesFirst.button'));
    // The dialog stays in the document while it shrinks away.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(status()).toHaveTextContent('strategy.intro.title');
    expect(screen.getByText('strategy.intro.practiceText')).toBeInTheDocument();
    expect(screen.getByText('strategy.intro.liveText')).toBeInTheDocument();
    // No game yet, so no board to look at; and the explanation is under each
    // button, so no ⓘ to repeat it.
    expect(screen.queryByTestId('strategyBoard')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'strategy.info.label' })).not.toBeInTheDocument();
    fireEvent.click(button('strategy.intro.live'));
    expect(moves.chooseNewGameType).toHaveBeenCalledWith('live');
  });

  test('says the starting position may differ only in a game whose start varies', () => {
    renderBoard(betweenGames, { difficulty: null, numberOfTries: 0 }, NamedBoard);

    expect(screen.getByText('strategy.intro.practiceTextVaries')).toBeInTheDocument();
  });

  // The rules dialog opened over the end dialog, and asked to be read for a
  // game that could no longer be played.
  test('shows the end, not the rules, when the time ran out before any game', () => {
    renderBoard(betweenGames, { difficulty: null, numberOfTries: 0, millisecondsRemaining: -6000 });

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.queryByText('strategy.rulesFirst.title')).not.toBeInTheDocument();
  });
});

describe('the header strip', () => {
  test('is the one place for the live games so far and what the current run is worth', () => {
    renderBoard(betweenGames, { winner: GUESSER_PLAYER, liveResults: ['lost', 'won'], numberOfLoss: 1, winningStreak: 1, numberOfTries: 2 });

    const series = screen.getByRole('group', { name: 'strategy.series.label' });
    expect(within(series).getByRole('img', { name: 'strategy.series.lost' })).toBeInTheDocument();
    expect(within(series).getByRole('img', { name: 'strategy.series.won' })).toBeInTheDocument();
    // One more win needed: one empty slot, then the points.
    expect(within(series).getAllByRole('img', { name: 'strategy.series.next' })).toHaveLength(1);
    expect(within(series).getByText('strategy.series.total')).toBeInTheDocument();
    expect(within(series).getByRole('button', { name: 'strategy.series.helpLabel' })).toBeInTheDocument();
    // The game area does not repeat it.
    expect(within(screen.getByTestId('gameArea')).queryByText(/strategy\.series/)).not.toBeInTheDocument();
  });

  // Nine losses before a win filled the strip past its line.
  test('shows only the two latest games before the run, the rest as a count', () => {
    const liveResults = ['won', 'lost', 'lost', 'lost', 'lost', 'lost', 'lost', 'lost', 'lost'] as const;
    renderBoard(betweenGames, { winner: JUDGE_PLAYER, liveResults: [...liveResults], numberOfLoss: 8, numberOfTries: 9 });

    const series = screen.getByRole('group', { name: 'strategy.series.label' });
    expect(within(series).getByRole('img', { name: 'strategy.series.earlier' })).toBeInTheDocument();
    expect(within(series).getAllByRole('img', { name: 'strategy.series.lost' })).toHaveLength(2);
    expect(within(series).queryByRole('img', { name: 'strategy.series.won' })).not.toBeInTheDocument();
  });

  test('marks the slot of the live game being played, and only during a live game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'live', liveResults: ['lost'], numberOfLoss: 1, numberOfTries: 2 });

    const series = screen.getByRole('group', { name: 'strategy.series.label' });
    expect(within(series).getByRole('img', { name: 'strategy.series.current' })).toBeInTheDocument();
    expect(within(series).getAllByRole('img', { name: 'strategy.series.next' })).toHaveLength(1);
  });

  test('marks no slot during a practice game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'test', liveResults: ['lost'], numberOfLoss: 1, numberOfTries: 1 });

    const series = screen.getByRole('group', { name: 'strategy.series.label' });
    expect(within(series).queryByRole('img', { name: 'strategy.series.current' })).not.toBeInTheDocument();
    expect(within(series).getAllByRole('img', { name: 'strategy.series.next' })).toHaveLength(2);
  });

  test('keeps the clock, and the rules behind a button', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(screen.getByTitle('general.remainingTime')).toBeInTheDocument();
    expect(screen.queryByText('the rules')).not.toBeInTheDocument();
    fireEvent.click(button('strategy.rules'));
    // jsdom has no matchMedia, so this renders as on a phone: in a dialog.
    expect(screen.getByRole('dialog')).toHaveTextContent('the rules');
  });
});

describe('between games', () => {
  test('shows a live loss in the middle, with the next game and the ⓘ beside it', () => {
    renderBoard(betweenGames, { winner: JUDGE_PLAYER, numberOfLoss: 1, liveResults: ['lost'] });

    expect(status()).toHaveTextContent('strategy.result.liveLost');
    // The loss lowered the stake and restarted the run, so the line says so.
    expect(screen.getByText('strategy.result.liveLostNext')).toBeInTheDocument();
    expect(button('strategy.next.practice')).toBeEnabled();
    expect(button('strategy.next.live')).toBeEnabled();
    expect(button('strategy.info.label')).toBeInTheDocument();
    // The final position stays to read, but not to play.
    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(boardArea()).toBeDisabled();
  });

  // Before the first live game the team is about to choose one.
  test('says how live may differ after a practice win, until the first live game', () => {
    renderBoard(betweenGames, { difficulty: 'test', winner: GUESSER_PLAYER, numberOfTries: 0 });

    expect(status()).toHaveTextContent('strategy.result.practiceWon');
    expect(screen.getByText('strategy.result.practiceNote')).toBeInTheDocument();
    expect(screen.getByText('strategy.result.practiceNoteBot')).toBeInTheDocument();
  });

  test('after a practice loss in a game whose start is fixed, adds nothing', () => {
    renderBoard(betweenGames, { difficulty: 'test', winner: JUDGE_PLAYER, numberOfTries: 0 });
    expect(screen.queryByText('strategy.result.practiceNoteStart')).not.toBeInTheDocument();
  });

  test('after a practice loss in a game whose start varies, says so', () => {
    renderBoard(betweenGames, { difficulty: 'test', winner: JUDGE_PLAYER, numberOfTries: 0 }, NamedBoard);
    expect(screen.getByText('strategy.result.practiceNoteStart')).toBeInTheDocument();
  });

  test('says after the first live win that one more completes the task', () => {
    renderBoard(betweenGames, { winner: GUESSER_PLAYER, winningStreak: 1, liveResults: ['won'] });

    expect(status()).toHaveTextContent('strategy.result.liveWon');
    expect(screen.getByText('strategy.result.liveWonFirst')).toBeInTheDocument();
  });

  test('leaves the explanation behind the ⓘ once a live game was played', () => {
    renderBoard(betweenGames, { difficulty: 'test', winner: GUESSER_PLAYER, numberOfTries: 1, liveResults: ['lost'] });

    expect(screen.queryByText('strategy.result.practiceNoteBot')).not.toBeInTheDocument();
    expect(button('strategy.info.label')).toBeInTheDocument();
  });

  // The judge sets the opening position of each new game, so it moves in
  // `startNewGame` too, and the team's buttons would only be refused.
  test('holds the buttons while the judge opens the chosen game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: JUDGE_PLAYER }, { difficulty: 'test' });

    expect(status()).toHaveTextContent('strategy.status.starting');
    expect(button('strategy.next.live')).toBeDisabled();
    expect(boardArea()).toHaveAttribute('data-state', 'empty');
  });
});

describe('choosing a role', () => {
  test('offers the default roles over the opening position, which is to read but not to play', () => {
    const moves = renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER });

    expect(status()).toHaveTextContent('strategy.status.role');
    expect(screen.queryByText('strategy.status.lookAtPosition')).not.toBeInTheDocument();
    // Disabled, not hidden: `inert` would hide the position from a screen
    // reader, and the role query alone does not see that.
    expect(boardArea().closest('[inert]')).toBeNull();
    expect(button('cell')).toBeDisabled();
    play.mockClear();
    fireEvent.click(button('cell'));
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(button('strategy.firstPlayer'));
    expect(moves.chooseRole).toHaveBeenCalledWith(GUESSER_PLAYER);
  });

  test('uses the game\'s own role names, and asks to look at a varying start', () => {
    const moves = renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER }, {}, NamedBoard);

    expect(screen.getByText('strategy.status.lookAtPosition')).toBeInTheDocument();
    fireEvent.click(button('Másodikak leszünk (2 X)'));
    expect(moves.chooseRole).toHaveBeenCalledWith(JUDGE_PLAYER);
  });
});

describe('during a game', () => {
  test('lets the team move on its turn', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(status()).toHaveTextContent('strategy.status.yourTurn');
    expect(boardArea()).toHaveAttribute('data-state', 'live');
    expect(boardArea()).toBeEnabled();
    play.mockClear();
    fireEvent.click(button('cell'));
    expect(play).toHaveBeenCalled();
  });

  // Fading on each of the bot's turns would flash the board every move.
  test('ignores clicks on the bot\'s turn without fading', () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER });

    expect(status()).toHaveTextContent('strategy.status.botTurn');
    expect(boardArea()).toHaveAttribute('data-state', 'waiting');
    expect(boardArea()).toBeDisabled();
    play.mockClear();
    fireEvent.click(screen.getByTestId('cell'));
    expect(play).not.toHaveBeenCalled();
  });

  // Shown at once, the spinner would flash on every one of the bot's moves.
  test('shows a spinner only once the bot is slow to answer', async () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER });

    expect(screen.queryByTestId('botThinking')).not.toBeInTheDocument();
    // Not during the bot's own 400 ms pause, which every move takes.
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(screen.queryByTestId('botThinking')).not.toBeInTheDocument();
    expect(await screen.findByTestId('botThinking', {}, { timeout: 2500 })).toBeInTheDocument();
  });

  // A status element inserted already filled is often not announced, so the
  // turn changes inside one that stays.
  test('keeps one status element as the turn passes', () => {
    const { rerender } = render(boardElement({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER }).element);
    const first = status();

    rerender(boardElement({ phase: 'play', currentPlayer: JUDGE_PLAYER }).element);
    expect(status()).toBe(first);
    expect(first).toHaveTextContent('strategy.status.botTurn');
    rerender(boardElement({ phase: 'play', currentPlayer: GUESSER_PLAYER }).element);
    expect(status()).toBe(first);
    expect(first).toHaveTextContent('strategy.status.yourTurn');
  });

  test('names the mode above the game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'test' });

    expect(screen.getByTestId('gameArea')).toHaveAttribute('data-mode', 'test');
    expect(screen.getByText('strategy.mode.practice')).toBeInTheDocument();
  });

  test('leaves no empty slots in the strip once the time ran out', () => {
    renderBoard(betweenGames, { winner: JUDGE_PLAYER, liveResults: ['lost'], numberOfLoss: 1, millisecondsRemaining: -6000 });

    const series = screen.getAllByRole('group', { name: 'strategy.series.label', hidden: true })
      .find(group => group.closest('[role="dialog"]') === null) as HTMLElement;
    expect(within(series).getByRole('img', { name: 'strategy.series.lost', hidden: true })).toBeInTheDocument();
    expect(within(series).queryByRole('img', { name: 'strategy.series.next', hidden: true })).not.toBeInTheDocument();
    expect(within(series).queryByText('strategy.series.total')).not.toBeInTheDocument();
  });

  test('locks the board and offers nothing once the time ran out', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { millisecondsRemaining: -6000 });

    // Behind the end dialog, which hides the page from the accessibility tree.
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('strategy.result.timeUp');
    expect(screen.getByText('strategy.result.unfinished')).toBeInTheDocument();
    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The countdown would show XX:XX:XX ten seconds past the end.
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });
});

// Behind the end dialog the strip shows the run that ended the match.
describe('after the second win', () => {
  test('counts both wins and the points earned', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER, gameover: true },
      { winner: GUESSER_PLAYER, winningStreak: 2, points: 12, liveResults: ['won', 'won'] });

    // The strip, not the same row in the end dialog over it.
    const series = screen.getAllByRole('group', { name: 'strategy.series.label', hidden: true })
      .find(group => group.closest('[role="dialog"]') === null) as HTMLElement;
    expect(within(series).getAllByRole('img', { name: 'strategy.series.won', hidden: true })).toHaveLength(2);
    expect(within(series).queryByRole('img', { name: 'strategy.series.next', hidden: true })).not.toBeInTheDocument();
  });
});

describe('the rules and role names', () => {
  const firstVisit = { difficulty: null, numberOfTries: 0 };
  const rulesOf = (rules: StrategyDescription) => boardWrapper<object>(cellBoard, rules, {});

  test('are the ones given, whatever the page language, when given once', () => {
    i18n.language = 'en';
    renderBoard(betweenGames, firstVisit, rulesOf(<p>egyetlen szabály</p>));

    expect(screen.getByRole('dialog')).toHaveTextContent('egyetlen szabály');
  });

  test('are in the page language', () => {
    i18n.language = 'en';
    renderBoard(betweenGames, firstVisit, rulesOf({ hu: 'magyar szabály', en: 'English rule' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('English rule');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('magyar szabály');
  });

  test('are in another language where the game has none in the page\'s', () => {
    i18n.language = 'en';
    renderBoard(betweenGames, firstVisit, rulesOf({ hu: 'magyar szabály' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('magyar szabály');
  });

  test('name the roles in the page language', () => {
    i18n.language = 'en';
    renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER }, {}, boardWrapper<object>(cellBoard, <p>the rules</p>, {
      roleLabels: [{ hu: 'Kezdő (1 O)', en: 'First (1 O)' }, { hu: 'Második (2 X)', en: 'Second (2 X)' }],
    }));

    expect(button('First (1 O)')).toBeInTheDocument();
  });

  // The same label names the role on the chip once it is chosen, so a game
  // writes its roles once.
  test('show the chosen role beside the mode during the game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { firstPlayer: JUDGE_PLAYER }, boardWrapper<object>(cellBoard, <p>the rules</p>, {
      roleLabels: ['Kezdő (1 O)', 'Második (2 X)'],
    }));

    expect(screen.getByText('Második (2 X)')).toBeInTheDocument();
  });

  test('show who starts as the role of a game that names none', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { firstPlayer: GUESSER_PLAYER });

    expect(screen.getByText('strategy.role.first')).toBeInTheDocument();
  });

  // The chip is for reading the board while a game is played, not the end.
  test('show no role once the time is up', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { firstPlayer: GUESSER_PLAYER, millisecondsRemaining: -6000 });

    expect(screen.queryByText('strategy.role.first')).not.toBeInTheDocument();
  });
});

describe('the game\'s own words on the move', () => {
  // A game whose step depends on part of a move already in its state, as the
  // 5×5 game's second X does.
  const StepBoard = boardWrapper<{ halfMove?: boolean }>(cellBoard, <p>the rules</p>, {
    getPlayerStepDescription: ({ G }) => G.halfMove ? 'second step' : 'first step',
  });

  test('tell the team its next step under the status, as the game state has it', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { halfMove: true }, StepBoard);

    expect(screen.getByText('second step')).toBeInTheDocument();
  });

  test('say nothing of a step on the bot\'s turn', () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER }, {}, StepBoard);

    expect(screen.queryByText(/step/)).not.toBeInTheDocument();
  });
});
