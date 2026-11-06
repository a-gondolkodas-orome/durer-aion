// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, MyGameState } from 'game';
import { ClientRepoProvider } from '../../client-repo-context';
import { MockClientRepository } from '../../mock-client-repository';
import type { ClientRepository } from '../../api-repository-interface';
import { InProgressRelay } from './InProgressRelay';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: (props: { i18nKey: string }) => props.i18nKey,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

// Five seconds past the end opens the end dialog; the game ends a relay only
// on a move, so one left to run out has not ended.
const G: MyGameState = {
  currentProblem: 1,
  problemText: 'second problem',
  answer: null,
  points: 3,
  correctnessPreviousAnswer: true,
  previousAnswers: [[{ answer: 9, date: '2026-10-10T10:02:00Z' }], []],
  previousPoints: [3],
  currentProblemAvailablePoints: 4,
  maxPointsList: [3, 4],
  numberOfTry: 1,
  millisecondsRemaining: -6000,
  start: '2026-10-10T10:00:00Z',
  end: '2026-10-10T11:00:00Z',
  url: '',
};

// Relay practice's board: its way out logs out to the round selector, where
// the dry run's reloads the page, which jsdom cannot.
async function renderBoard(ctx: Partial<Ctx>) {
  const repo: ClientRepository = new MockClientRepository();
  // A team in the middle of a relay match.
  await repo.joinWithCode('2');
  // Only the local apps' repositories keep an end report; the mock has none.
  const keepRelayEnd = vi.fn();
  repo.keepRelayEnd = keepRelayEnd;
  const moves = { getTime: vi.fn(), startGame: vi.fn(), submitAnswer: vi.fn() };
  const props = { G, ctx: { currentPlayer: GUESSER_PLAYER, ...ctx }, moves } as unknown as Parameters<typeof InProgressRelay>[0];
  render(<ClientRepoProvider value={repo}><InProgressRelay {...props} selectRoundOnEnd/></ClientRepoProvider>);
  return keepRelayEnd;
}

// Regression: a relay left to run out never ended, so no end report stored its
// score, and whichever way the team left the dialog, it went home with 0.
test('a relay whose time ran out hands its end report over once, however the dialog is left', async () => {
  const keepRelayEnd = await renderBoard({});

  expect(keepRelayEnd).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ component: 'relay', phase: 'end', G }));

  await act(async () => {
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'relay.endTable.selectOtherRound' }));
  });

  expect(keepRelayEnd).toHaveBeenCalledOnce();
});

test('a relay the game ended reported its end itself', async () => {
  const keepRelayEnd = await renderBoard({ gameover: true });

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(keepRelayEnd).not.toHaveBeenCalled();
});
