// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
// The board's text comes from i18next, which this module initialises — the same
// way the apps get it.
import i18next from './i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Ctx } from 'boardgame.io';
import type { GameStateMixin } from 'game';
import { ClientRepoProvider, MockClientRepository } from '../client/api-repository-interface';
import { MockTeamState } from '../client/hooks/mock-user-hooks';
import themeConfig from '../client/components/theme';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoardProps } from './boardwrapper';

// The wrapper's end-of-match buttons go through these.
vi.mock('../client/hooks/user-hooks', () => MockTeamState.mockHook);

const t = (key: string) => i18next.t(key);

const Board = boardWrapper<object>(() => <div data-testid="board" />, null);

/// Only the fields the wrapper reads; boardgame.io hands a board plenty more.
function boardProps(ctx: Partial<Ctx>, G: Partial<GameStateMixin> = {}) {
  return {
    G: {
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
      ...G,
    },
    ctx: {
      numPlayers: 2,
      playOrder: ['0', '1'],
      playOrderPos: 0,
      activePlayers: null,
      currentPlayer: '0',
      turn: 1,
      phase: 'startNewGame',
      ...ctx,
    },
    moves: { getTime: vi.fn(), chooseNewGameType: vi.fn(), chooseRole: vi.fn() },
  } as unknown as StrategyBoardProps<object>;
}

const renderBoard = (props: StrategyBoardProps<object>) =>
  render(
    <ThemeProvider theme={createTheme(themeConfig)}>
      <ClientRepoProvider value={new MockClientRepository()}>
        <Board {...props} />
      </ClientRepoProvider>
    </ThemeProvider>
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe('the strategy board while the judge is thinking', () => {
  // The judge sets the opening position of every new game, so its turn is not
  // only a `play` one. It used to be the phase that decided what the board
  // said, which left the team looking at buttons that refuse the move.
  test('says it is waiting, in the phase where the judge opens the game', () => {
    const { queryByText, getByText } = renderBoard(
      boardProps({ phase: 'startNewGame', currentPlayer: '1' })
    );

    expect(getByText(t('strategy.guide.waitingForServer'))).toBeInTheDocument();
    expect(queryByText(t('strategy.guide.newGame'))).not.toBeInTheDocument();
    expect(queryByText(t('strategy.testGameButton'))).not.toBeInTheDocument();
    expect(queryByText(t('strategy.realGameButton'))).not.toBeInTheDocument();
  });

  test('says it is waiting during a game as well', () => {
    const { getByText } = renderBoard(boardProps({ phase: 'play', currentPlayer: '1' }));

    expect(getByText(t('strategy.guide.waitingForServer'))).toBeInTheDocument();
  });

  test('offers the new game when the turn is the team\'s', () => {
    const { queryByText, getByText } = renderBoard(
      boardProps({ phase: 'startNewGame', currentPlayer: '0' })
    );

    expect(getByText(t('strategy.guide.newGame'))).toBeInTheDocument();
    expect(getByText(t('strategy.testGameButton'))).toBeInTheDocument();
    expect(queryByText(t('strategy.guide.waitingForServer'))).not.toBeInTheDocument();
  });

  test('says it is the team\'s turn during a game', () => {
    const { queryByText, getByText } = renderBoard(boardProps({ phase: 'play', currentPlayer: '0' }));

    expect(getByText(t('strategy.guide.yourTurn'))).toBeInTheDocument();
    expect(queryByText(t('strategy.guide.waitingForServer'))).not.toBeInTheDocument();
  });
});
