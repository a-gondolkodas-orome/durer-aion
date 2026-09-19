// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi, describe } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
// `toBeInTheDocument`, `toBeDisabled` and friends.
import '@testing-library/jest-dom';
// The wrapper translates its labels, so i18next has to be initialised the way
// the apps initialise it: by importing this module.
import './i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Ctx } from 'boardgame.io';
import { MockTeamState } from '../client/hooks/mock-user-hooks';
import { ClientRepoProvider, MockClientRepository } from '../client/api-repository-interface';
import themeConfig from '../client/components/theme';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoardProps } from './boardwrapper';
import type { GameStateMixin } from 'game';

// The wrapper's "back to home" path goes through these; nothing here reaches it.
vi.mock('../client/hooks/user-hooks', () => MockTeamState.mockHook);

/// Pins the gating from issue #4: the four buttons under "Akciók" and the board
/// itself refuse clicks that the rules would reject anyway, and the board is
/// faded while no game is on it. Every case sets bgio's `isActive` by hand,
/// which is what the client computes from the turn and `ctx.gameover`.

interface StubState { cells: number }

const moves = {
  getTime: vi.fn(),
  chooseNewGameType: vi.fn(),
  chooseRole: vi.fn(),
  play: vi.fn(),
};

// A board with one control, to see whether a click on it gets through.
const StubBoard = (props: StrategyBoardProps<StubState>) => (
  <button data-testid="cell" onClick={() => props.moves.play()}>{props.G.cells}</button>
);

const Wrapped = boardWrapper(StubBoard, <p>description</p>);

function makeProps({ phase, isActive, msRemaining = 30 * 60 * 1000 }:
  { phase: Ctx['phase'], isActive: boolean, msRemaining?: number }): StrategyBoardProps<StubState> {
  const G: StubState & GameStateMixin = {
    cells: 3,
    millisecondsRemaining: msRemaining,
    start: new Date().toISOString(),
    end: new Date(Date.now() + msRemaining).toISOString(),
    firstPlayer: null,
    difficulty: null,
    winner: null,
    numberOfTries: 0,
    numberOfLoss: 0,
    winningStreak: 0,
    points: 0,
  };
  const ctx: Ctx = {
    numPlayers: 2,
    playOrder: ['0', '1'],
    playOrderPos: isActive ? 0 : 1,
    activePlayers: null,
    currentPlayer: isActive ? '0' : '1',
    turn: 1,
    phase,
  };
  // The wrapper reads only what is set here; the rest of bgio's props are
  // for a board, and the stub above does not ask for them.
  return { G, ctx, moves, isActive, playerID: '0' } as unknown as StrategyBoardProps<StubState>;
}

// `boardWrapper` reads `palette.background.paperOpacity`, which only the apps'
// theme declares, and the client repository off context, as in the apps.
const renderWrapped = (props: StrategyBoardProps<StubState>) =>
  render(
    <ThemeProvider theme={createTheme(themeConfig)}>
      <ClientRepoProvider value={new MockClientRepository()}>
        <Wrapped {...props} />
      </ClientRepoProvider>
    </ThemeProvider>
  );

const startButtons = (getByText: (text: string) => HTMLElement) =>
  [getByText('Új próbajáték kezdése'), getByText('Új éles játék kezdése')];

describe('before a game: the start buttons', () => {
  test('are enabled on the team\'s turn', () => {
    const { getByText } = renderWrapped(makeProps({ phase: 'startNewGame', isActive: true }));
    for (const button of startButtons(getByText)) {
      expect(button).toBeEnabled();
    }
    fireEvent.click(getByText('Új éles játék kezdése'));
    expect(moves.chooseNewGameType).toHaveBeenCalledWith('live');
  });

  test('are disabled while the bot is placing the position', () => {
    const { getByText } = renderWrapped(makeProps({ phase: 'startNewGame', isActive: false }));
    for (const button of startButtons(getByText)) {
      expect(button).toBeDisabled();
    }
  });

  test('are disabled once the time ran out', () => {
    const { getByText } = renderWrapped(makeProps({ phase: 'startNewGame', isActive: true, msRemaining: -6000 }));
    for (const button of startButtons(getByText)) {
      expect(button).toBeDisabled();
    }
  });
});

describe('choosing a role: the role buttons', () => {
  test('are enabled on the team\'s turn', () => {
    const { getByText } = renderWrapped(makeProps({ phase: 'chooseRole', isActive: true }));
    expect(getByText('Kezdő leszek')).toBeEnabled();
    expect(getByText('Második leszek')).toBeEnabled();
  });

  test('are disabled out of turn', () => {
    const { getByText } = renderWrapped(makeProps({ phase: 'chooseRole', isActive: false }));
    expect(getByText('Kezdő leszek')).toBeDisabled();
    expect(getByText('Második leszek')).toBeDisabled();
  });
});

describe('the board', () => {
  test('is faded and inert while no game is on it', () => {
    const { getByTestId } = renderWrapped(makeProps({ phase: 'startNewGame', isActive: true }));
    const board = getByTestId('strategyBoard');
    expect(board).toHaveAttribute('aria-disabled', 'true');
    expect(board).toHaveStyle({ opacity: '0.4', pointerEvents: 'none' });
  });

  test('is faded while a role is being chosen', () => {
    const { getByTestId } = renderWrapped(makeProps({ phase: 'chooseRole', isActive: true }));
    expect(getByTestId('strategyBoard')).toHaveStyle({ opacity: '0.4' });
  });

  test('is live on the team\'s turn in a running game', () => {
    const { getByTestId } = renderWrapped(makeProps({ phase: 'play', isActive: true }));
    const board = getByTestId('strategyBoard');
    expect(board).toHaveAttribute('aria-disabled', 'false');
    expect(board).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
    fireEvent.click(getByTestId('cell'));
    expect(moves.play).toHaveBeenCalled();
  });

  test('ignores clicks on the bot\'s turn without fading', () => {
    const { getByTestId } = renderWrapped(makeProps({ phase: 'play', isActive: false }));
    const board = getByTestId('strategyBoard');
    expect(board).toHaveAttribute('aria-disabled', 'true');
    expect(board).toHaveStyle({ opacity: '1', pointerEvents: 'none' });
  });

  test('is faded and inert once the time ran out', () => {
    const { getByTestId } = renderWrapped(makeProps({ phase: 'play', isActive: true, msRemaining: -6000 }));
    const board = getByTestId('strategyBoard');
    expect(board).toHaveAttribute('aria-disabled', 'true');
    expect(board).toHaveStyle({ opacity: '0.4', pointerEvents: 'none' });
  });
});
