// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import type { Ctx } from 'boardgame.io';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { JUDGE_RESUME_DELAY_MS, withJudgeResume } from './JudgeResume';

interface Props { ctx: Ctx; _stateID: number; matchID: string; isConnected: boolean }

const Board = withJudgeResume((_: Props) => null);
const repo = new MockClientRepository();

function board({ currentPlayer = '1', stateID = 1, isConnected = true, gameover = undefined as unknown }) {
  const ctx = { currentPlayer, gameover } as Ctx;
  return <ClientRepoProvider value={repo}>
    <Board ctx={ctx} _stateID={stateID} matchID="match" isConnected={isConnected}/>
  </ClientRepoProvider>;
}
const wait = (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });

let resume: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  resume = vi.spyOn(repo, 'resumeJudgeTurn');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('asks for the judge\'s turn once it has waited the delay, and again while it waits', async () => {
  render(board({}));
  await wait(JUDGE_RESUME_DELAY_MS - 1);
  expect(resume).not.toHaveBeenCalled();

  await wait(1);
  expect(resume).toHaveBeenCalledExactlyOnceWith('match');
  await wait(JUDGE_RESUME_DELAY_MS);
  expect(resume).toHaveBeenCalledTimes(2);
});

test('stops asking once the judge has moved', async () => {
  const { rerender } = render(board({}));
  rerender(board({ currentPlayer: '0', stateID: 2 }));
  await wait(2 * JUDGE_RESUME_DELAY_MS);

  expect(resume).not.toHaveBeenCalled();
});
