// @vitest-environment jsdom
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Ctx } from 'boardgame.io';
import { JUDGE_PLAYER } from 'game';
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

const Board = boardWrapper<object>(() => <div />, null);

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
  const props = {
    G,
    ctx: { numPlayers: 2, playOrder: ['0', '1'], playOrderPos: 0, activePlayers: null, turn: 1, ...ctx },
    moves: { getTime: vi.fn(), chooseNewGameType: vi.fn(), chooseRole: vi.fn() },
  } as unknown as StrategyBoardProps<object>;
  render(
    <ClientRepoProvider value={new MockClientRepository()}>
      <Board {...props} />
    </ClientRepoProvider>
  );
}

describe('the strategy board on the judge\'s turn', () => {
  // A game without a fixed `startingPosition` has the judge set the opening
  // position, so the judge moves in `startNewGame` too — and the team used to
  // be offered the two new-game buttons there, which refuse the move.
  test('says it is waiting while the judge opens a new game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '1' });

    expect(screen.getByText('strategy.guide.waitingForServer')).toBeInTheDocument();
    expect(screen.getByText('strategy.guide.liveStarted')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.newGame')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.testGameButton')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.realGameButton')).not.toBeInTheDocument();
  });

  test('says it is waiting during a game', () => {
    renderBoard({ phase: 'play', currentPlayer: '1' });

    expect(screen.getByText('strategy.guide.waitingForServer')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.yourTurn')).not.toBeInTheDocument();
  });

  // `startNewGame` with the team to move is the gap between games, never a
  // move inside one: the match opens on it, and a game that ends returns to it.
  test('offers the first game of the match', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '0' });

    expect(screen.getByText('strategy.guide.newGame')).toBeInTheDocument();
    expect(screen.getByText('strategy.testGameButton')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });

  test('offers the next game once one has ended, under its result', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '0' }, { winner: JUDGE_PLAYER });

    expect(screen.getByText('strategy.guide.botWins')).toBeInTheDocument();
    expect(screen.getByText('strategy.testGameButton')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.newGame')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });

  test('says it is the team\'s turn during a game', () => {
    renderBoard({ phase: 'play', currentPlayer: '0' });

    expect(screen.getByText('strategy.guide.yourTurn')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });
});
