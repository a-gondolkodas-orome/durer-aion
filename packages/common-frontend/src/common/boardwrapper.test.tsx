// @vitest-environment jsdom
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
const Board = boardWrapper<object>(() => <button data-testid="cell" onClick={play}>cell</button>, null);

/// Only the fields the wrapper reads; boardgame.io hands a board plenty more.
function renderBoard(ctx: Partial<Ctx>, game: Partial<GameStateMixin> = {}) {
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
  render(
    <ClientRepoProvider value={new MockClientRepository()}>
      <Board {...props} />
    </ClientRepoProvider>
  );
  return moves;
}

const startButtons = () => [
  screen.getByRole('button', { name: 'strategy.chooser.practiceButton' }),
  screen.getByRole('button', { name: 'strategy.chooser.liveButton' }),
];
const boardArea = () => screen.getByTestId('strategyBoard');

describe('between games', () => {
  // `startNewGame` with the team to move is the gap between games, never a
  // move inside one: the match opens on it, and a game that ends returns to it.
  test('offers the first game of the match on a faded board', () => {
    const moves = renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER }, { difficulty: null });

    for (const button of startButtons()) {
      expect(button).toBeEnabled();
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // No game has been chosen, so there is no mode to frame it in.
    expect(screen.queryByText('strategy.mode.liveNumber')).not.toBeInTheDocument();
    expect(boardArea()).toHaveAttribute('data-state', 'empty');
    expect(boardArea()).toHaveAttribute('inert');

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

    expect(screen.getByRole('status')).toHaveTextContent('strategy.result.liveLost');
    // The loss lowered the stake, so the bar says from what to what.
    expect(screen.getByText('strategy.result.liveLostDrop')).toBeInTheDocument();
    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(screen.getByText('strategy.board.finalViewOnly')).toBeInTheDocument();
    for (const button of startButtons()) {
      expect(button).toBeEnabled();
    }
  });

  test('shows a live win as the first of two', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER },
      { winner: GUESSER_PLAYER, winningStreak: 1, liveResults: ['won'] });

    expect(screen.getByRole('status')).toHaveTextContent('strategy.result.liveWon');
    expect(screen.getByText('strategy.result.liveWonDetail')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'strategy.goal.firstWin' })).toBeInTheDocument();
    expect(screen.getByText('strategy.chooser.liveIfWinDone')).toBeInTheDocument();
  });

  test('says a practice win does not count, and that the live computer may play better', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: GUESSER_PLAYER },
      { difficulty: 'test', winner: GUESSER_PLAYER });

    expect(screen.getByRole('status')).toHaveTextContent('strategy.result.practiceWon');
    expect(screen.getByRole('status')).toHaveTextContent('strategy.result.practiceDetail');
    expect(screen.getByRole('status')).toHaveTextContent('strategy.practiceWarning.title');
    // The band of the game that just ended still names its mode.
    expect(screen.getByText('strategy.mode.practiceKeeps')).toBeInTheDocument();
  });
});

describe('choosing a role', () => {
  test('shows the opening position locked, with the role buttons above it', () => {
    const moves = renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER });

    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(boardArea()).toHaveAttribute('inert');
    expect(screen.getByText('strategy.board.viewOnly')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'strategy.firstPlayer' }));
    expect(moves.chooseRole).toHaveBeenCalledWith(GUESSER_PLAYER);
  });
});

describe('during a game', () => {
  test('lets the team move on its turn', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER });

    expect(screen.getByRole('status')).toHaveTextContent('strategy.board.yourTurn');
    expect(boardArea()).toHaveAttribute('data-state', 'live');
    expect(boardArea()).not.toHaveAttribute('inert');
    fireEvent.click(screen.getByTestId('cell'));
    expect(play).toHaveBeenCalled();
  });

  // Fading on each of the bot's turns would flash the board every move.
  test('ignores clicks on the bot\'s turn without fading', () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER });

    expect(screen.getByRole('status')).toHaveTextContent('strategy.board.botTurn');
    expect(boardArea()).toHaveAttribute('data-state', 'waiting');
    expect(boardArea()).toHaveAttribute('inert');
    expect(boardArea()).not.toHaveStyle({ opacity: '0.4' });
  });

  test('locks the board and offers nothing once the time ran out', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { millisecondsRemaining: -6000 });

    expect(boardArea()).toHaveAttribute('data-state', 'locked');
    expect(screen.queryByText('strategy.board.yourTurn')).not.toBeInTheDocument();
  });

  test('frames a live game with its stake, and a practice game as not counting', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { difficulty: 'test' });

    expect(screen.getByText('strategy.mode.practiceSub')).toBeInTheDocument();
    expect(screen.queryByText('strategy.mode.stake')).not.toBeInTheDocument();
    expect(screen.getByText('strategy.practiceWarning.title')).toBeInTheDocument();
  });
});
