// @vitest-environment jsdom
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, JUDGE_PLAYER } from 'game';
import type { GameStateMixin } from 'game';
import { ClientRepoProvider } from '../client/client-repo-context';
import { MockClientRepository } from '../client/mock-client-repository';
import { MockTeamState } from '../client/hooks/mock-user-hooks';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoardProps } from './boardwrapper';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../client/hooks/user-hooks', () => MockTeamState.mockHook);

const play = vi.fn();
// A board with one control, to see whether a click on it gets through.
const Board = boardWrapper<object>(() => <button data-testid="cell" onClick={play}>cell</button>, <p>the rules</p>);

/// Only the fields the wrapper reads; boardgame.io hands a board plenty more.
function boardProps(ctx: Partial<Ctx>, game: Partial<GameStateMixin> = {}) {
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
  return { moves, element: <ClientRepoProvider value={clientRepo}><Board {...props} /></ClientRepoProvider> };
}

const clientRepo = new MockClientRepository();

function renderBoard(ctx: Partial<Ctx>, game: Partial<GameStateMixin> = {}) {
  const { moves, element } = boardProps(ctx, game);
  render(element);
  return moves;
}

const startButtons = () => [
  screen.getByRole('button', { name: 'strategy.chooser.practiceButton' }),
  screen.getByRole('button', { name: 'strategy.chooser.liveButton' }),
];
const boardArea = () => screen.getByTestId('strategyBoard');
const turnStatus = () => screen.getByTestId('turnStatus');
const result = () => screen.getByTestId('result');

describe('between games', () => {
  // `startNewGame` with the team to move is the gap between games, never a
  // move inside one: the match opens on it, and a game that ends returns to it.
  test('offers the first game of the match on a faded board, once the rules are read', async () => {
    const moves = renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { difficulty: null });

    // The rules open the first screen in a dialog, which Esc does not close.
    expect(screen.getByRole('dialog')).toHaveTextContent('strategy.rulesFirst.title');
    expect(screen.getByRole('dialog')).toHaveTextContent('the rules');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'strategy.rulesFirst.button' }));
    // The dialog stays in the document while it fades out.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Before any game the cards are open, with all they say.
    expect(screen.getByText('strategy.practiceWarning.title')).toBeInTheDocument();
    for (const button of startButtons()) {
      expect(button).toBeEnabled();
    }
    expect(screen.queryByTestId('result')).not.toBeInTheDocument();
    expect(turnStatus()).toBeEmptyDOMElement();
    // No game has been chosen, so there is no mode to frame it in.
    expect(screen.queryByText('strategy.mode.liveNumber')).not.toBeInTheDocument();
    expect(boardArea()).toHaveAttribute('data-state', 'empty');
    expect(boardArea()).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'strategy.chooser.liveButton' }));
    expect(moves.chooseNewGameType).toHaveBeenCalledWith('live');
  });

  // The judge sets the opening position of each new game, so it moves in
  // `startNewGame` too, and the team's start buttons would only be refused.
  test('holds the start buttons while the judge opens the chosen game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: JUDGE_PLAYER }, { difficulty: 'test' });

    expect(screen.getByRole('button', { name: 'strategy.chooser.starting' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'strategy.chooser.liveButton' })).toBeDisabled();
    expect(boardArea()).toHaveAttribute('data-state', 'empty');
  });

  test('shows a live loss above the locked final position, and offers the next game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER },
      { winner: JUDGE_PLAYER, numberOfLoss: 1, liveResults: ['lost'] });

    expect(result()).toHaveTextContent('strategy.result.liveLost');
    // The loss lowered the stake, so the bar says from what to what.
    expect(screen.getByText('strategy.result.liveLostDrop')).toBeInTheDocument();
    // The consequence takes the bar's second line, in place of the game's number.
    expect(screen.queryByText('strategy.mode.liveNumber')).not.toBeInTheDocument();
    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    // The result labels the final position itself: red on the live bar's
    // orange read poorly, and a row of its own cost the board height.
    expect(boardArea().parentElement).toContainElement(result());
    expect(screen.queryByText('strategy.board.finalViewOnly')).not.toBeInTheDocument();
    // The lost game was played for the old stake; the new one is on the live card.
    expect(screen.queryByText('strategy.mode.stake')).not.toBeInTheDocument();
    for (const button of startButtons()) {
      expect(button).toBeEnabled();
    }
  });

  // Offered under the final position, the next game took a scroll to find,
  // and sat lower than before the first game.
  test('offers the next game above the board, as before the first', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { winner: JUDGE_PLAYER, numberOfLoss: 1 });

    const chooser = screen.getByText('strategy.chooser.title');
    expect(chooser.compareDocumentPosition(boardArea()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('shows a live win as the first of two', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER },
      { winner: GUESSER_PLAYER, winningStreak: 1, liveResults: ['won'] });

    expect(result()).toHaveTextContent('strategy.result.liveWon');
    expect(screen.getByText('strategy.result.liveWonDetail')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    // After a game the cards are folded to their title and button, and open on demand.
    expect(screen.queryByText('strategy.chooser.liveIfWinDone')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'strategy.chooser.details' })[1]);
    expect(screen.getByText('strategy.chooser.liveIfWinDone')).toBeInTheDocument();
    // Both open together: opened alone, one card stood beside an empty box.
    expect(screen.getByText('strategy.practiceWarning.title')).toBeInTheDocument();
    for (const toggle of screen.getAllByRole('button', { name: 'strategy.chooser.details' })) {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
  });

  test('says a practice win does not count, and that the live computer may play better', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER },
      { difficulty: 'test', winner: GUESSER_PLAYER });

    expect(result()).toHaveTextContent('strategy.result.practiceWon');
    // The bar's "not counted" line says what the result bar used to repeat.
    expect(screen.getByText('strategy.mode.practiceSub', { selector: 'div' })).toBeInTheDocument();
    // Said once on the screen, on the practice card, not again in the bar;
    // the card is folded after a game, so it shows once that is opened.
    expect(result()).not.toHaveTextContent('strategy.practiceWarning.title');
    expect(screen.queryByText('strategy.practiceWarning.title')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'strategy.chooser.details' })[0]);
    expect(screen.getAllByText('strategy.practiceWarning.title')).toHaveLength(1);
  });
});

describe('choosing a role', () => {
  test('shows the opening position locked, with the role buttons above it', () => {
    const moves = renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER });

    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(boardArea()).toBeDisabled();
    expect(screen.getByText('strategy.board.viewOnly')).toBeInTheDocument();
    // The position is there to be read, by a screen reader too, but not
    // played: its controls are disabled, not hidden. `inert` would hide them,
    // and the role query alone does not see that.
    expect(boardArea().closest('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: 'cell' })).toBeDisabled();
    play.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'cell' }));
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'strategy.firstPlayer' }));
    expect(moves.chooseRole).toHaveBeenCalledWith(GUESSER_PLAYER);
  });
});

describe('during a game', () => {
  test('frames a live game with its stake', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(screen.getByText('strategy.mode.stake')).toBeInTheDocument();
  });

  test('lets the team move on its turn', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    // On the board's own edge, where the team looks to move.
    expect(boardArea().parentElement).toContainElement(turnStatus());
    expect(turnStatus()).toHaveTextContent('strategy.board.yourTurn');
    expect(boardArea()).toHaveAttribute('data-state', 'live');
    expect(boardArea()).toBeEnabled();
    fireEvent.click(screen.getByTestId('cell'));
    expect(play).toHaveBeenCalled();
  });

  // Fading on each of the bot's turns would flash the board every move.
  test('ignores clicks on the bot\'s turn without fading', () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER });

    expect(turnStatus()).toHaveTextContent('strategy.board.botTurn');
    expect(boardArea().parentElement).toContainElement(turnStatus());
    expect(boardArea()).toHaveAttribute('data-state', 'waiting');
    expect(boardArea()).toBeDisabled();
    play.mockClear();
    fireEvent.click(screen.getByTestId('cell'));
    expect(play).not.toHaveBeenCalled();
    expect(boardArea()).not.toHaveStyle({ opacity: '0.4' });
  });

  // The rules dialog opened over the end dialog, and asked to be read for a
  // game that could no longer be played.
  test('shows the end, not the rules, when the time ran out before any game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { difficulty: null, millisecondsRemaining: -6000 });

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.queryByText('strategy.rulesFirst.title')).not.toBeInTheDocument();
  });

  // A status element inserted already filled is often not announced, so the
  // turn changes inside one that stays; and the board did not stay put
  // either, its spacing changing with each phase.
  test('keeps one status and one place for the board as the turn passes', () => {
    const { element } = boardProps({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER });
    const { rerender } = render(element);
    const status = turnStatus();
    const spacing = () => [getComputedStyle(boardArea()).paddingTop, getComputedStyle(boardArea().parentElement as HTMLElement).marginTop];
    const atRoleChoice = spacing();
    expect(atRoleChoice).toEqual(['30px', '24px']);
    expect(status).toBeEmptyDOMElement();

    rerender(boardProps({ phase: 'play', currentPlayer: JUDGE_PLAYER }).element);
    expect(turnStatus()).toBe(status);
    expect(status).toHaveTextContent('strategy.board.botTurn');
    rerender(boardProps({ phase: 'play', currentPlayer: GUESSER_PLAYER }).element);
    expect(turnStatus()).toBe(status);
    expect(status).toHaveTextContent('strategy.board.yourTurn');
    expect(spacing()).toEqual(atRoleChoice);
  });

  // Shown at once, the spinner would flash on every one of the bot's moves.
  test('shows a spinner only once the bot is slow to answer', async () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER });

    expect(screen.queryByTestId('botThinking')).not.toBeInTheDocument();
    expect(await screen.findByTestId('botThinking')).toBeInTheDocument();
  });

  test('locks the board and offers nothing once the time ran out', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { millisecondsRemaining: -6000 });

    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(screen.queryByText('strategy.board.yourTurn')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The countdown would show XX:XX:XX ten seconds past the end.
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  test('frames a live game with its stake, and a practice game as not counting', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'test' });

    expect(screen.getByText('strategy.mode.practiceSub')).toBeInTheDocument();
    expect(screen.queryByText('strategy.mode.stake')).not.toBeInTheDocument();
    expect(screen.getByText('strategy.practiceWarning.title')).toBeInTheDocument();
  });
});

describe('the goal panel', () => {
  // "Most N pont a tét" beside a practice game read as if the practice game
  // were played for it.
  test('names the stake as the next live game\'s in a practice game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'test' });

    expect(screen.getByText(/strategy\.goal\.stakeNextLive/)).toBeInTheDocument();
    expect(screen.queryByText(/strategy\.goal\.stake /)).not.toBeInTheDocument();
  });

  // Each sentence once on the screen.
  test('leaves the stake to the bar during a live game', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(screen.getByText('strategy.mode.stake')).toBeInTheDocument();
    expect(screen.queryByText(/strategy\.goal\.stake/)).not.toBeInTheDocument();
    expect(screen.getByText(/strategy\.goal\.ifLoseDrop/)).toBeInTheDocument();
  });

  test('leaves what a loss costs to the live card while the cards are open', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { winner: JUDGE_PLAYER, numberOfLoss: 1 });

    expect(screen.getByText(/strategy\.goal\.ifLoseDrop/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'strategy.chooser.details' })[0]);
    expect(screen.getByText('strategy.chooser.liveIfLoseDrop')).toBeInTheDocument();
    expect(screen.queryByText(/strategy\.goal\.ifLose/)).not.toBeInTheDocument();
  });
});

// jsdom has no matchMedia, so these render as on a phone.
// Behind the end dialog: the second slot stayed empty though both wins were in.
describe('the goal panel after the second win', () => {
  test('counts both wins and names nothing at stake', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER, gameover: true },
      { winner: GUESSER_PLAYER, winningStreak: 2, points: 12, liveResults: ['won', 'won'] });

    // Behind the dialog, which hides the page from the accessibility tree.
    expect(screen.getByRole('img', { name: 'strategy.goal.progressCount', hidden: true })).toHaveTextContent('2 / 2');
    expect(screen.queryByText(/strategy\.goal\.stake/)).not.toBeInTheDocument();
  });
});

describe('the bar above the game', () => {
  test('names the screen before the first game, and keeps the clock', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { difficulty: null });

    expect(screen.getByText('strategy.name')).toBeInTheDocument();
    expect(screen.getByTitle('general.remainingTime')).toBeInTheDocument();
  });

  test('opens the rules from its button on a phone', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(screen.queryByText('the rules')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'strategy.rules' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('the rules');
  });
});
