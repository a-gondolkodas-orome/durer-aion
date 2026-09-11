// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi, describe, beforeEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../../common/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import type { MyGameState } from 'game';
import { MockTeamState } from '../../hooks/mock-user-hooks';
import { ClientRepoProvider, MockClientRepository } from '../../api-repository-interface';
import themeConfig from '../theme';
import { InProgressRelay } from './InProgressRelay';

// The form refreshes the team state after a sent guess, so that hook has to
// hand back a function; the shared mock's is a bare spy.
vi.mock('../../hooks/user-hooks', () => ({
  ...MockTeamState.mockHook,
  useRefreshTeamState: () => () => Promise.resolve(),
}));

/// Pins that the relay's "Küldés" button takes a guess only when the server
/// would: on the team's turn, with a problem on the board, before the clock
/// ran out (issue #4). Every case sets bgio's `isActive` by hand, which is
/// what the client computes from the turn and `ctx.gameover`.

const moves = {
  startGame: vi.fn(),
  getTime: vi.fn(),
  submitAnswer: vi.fn(),
};

beforeEach(() => {
  moves.submitAnswer.mockClear();
});

function makeProps({ phase, isActive, msRemaining = 60 * 60 * 1000 }:
  { phase: Ctx['phase'], isActive: boolean, msRemaining?: number }): BoardProps<MyGameState> {
  const G: MyGameState = {
    currentProblem: 0,
    problemText: 'Mennyi 6 és 7 szorzata?',
    answer: null,
    points: 0,
    correctnessPreviousAnswer: null,
    previousAnswers: [[]],
    previousPoints: [],
    currentProblemMaxPoints: 3,
    numberOfTry: 1,
    millisecondsRemaining: msRemaining,
    start: new Date().toISOString(),
    end: new Date(Date.now() + msRemaining).toISOString(),
    url: '',
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
  // The board reads only what is set here.
  return { G, ctx, moves, isActive, playerID: '0' } as unknown as BoardProps<MyGameState>;
}

// The form pops up a notification and the board reads the client repository and
// `palette.background.paperOpacity` off context, as in the apps.
const renderRelay = (props: BoardProps<MyGameState>) =>
  render(
    <ThemeProvider theme={createTheme(themeConfig)}>
      <SnackbarProvider>
        <ClientRepoProvider value={new MockClientRepository()}>
          <InProgressRelay {...props} />
        </ClientRepoProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );

describe('the send button', () => {
  test('takes a guess on the team\'s turn', async () => {
    const { getByText, getByRole } = renderRelay(makeProps({ phase: 'play', isActive: true }));
    const button = getByText('Küldés');
    expect(button).toBeEnabled();
    // Formik validates and submits asynchronously, so the interaction has to
    // be awaited inside `act` for the resulting updates to be flushed.
    await act(async () => {
      fireEvent.change(getByRole('textbox'), { target: { value: '42' } });
      fireEvent.click(button);
    });
    expect(moves.submitAnswer).toHaveBeenCalledWith(42);
  });

  test('is disabled while the bot grades, and Enter sends nothing either', async () => {
    const { getByText, getByRole } = renderRelay(makeProps({ phase: 'play', isActive: false }));
    expect(getByText('Küldés')).toBeDisabled();
    const input = getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: '42' } });
      fireEvent.submit(input);
    });
    expect(moves.submitAnswer).not.toHaveBeenCalled();
  });

  test('is disabled before the first problem arrives', () => {
    const { getByText } = renderRelay(makeProps({ phase: 'startNewGame', isActive: false }));
    expect(getByText('Küldés')).toBeDisabled();
  });

  test('is disabled once the time ran out', () => {
    const { getByText } = renderRelay(makeProps({ phase: 'play', isActive: true, msRemaining: -6000 }));
    expect(getByText('Küldés')).toBeDisabled();
  });
});
