// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { CONNECTION_LOST_DELAY_MS, RECONNECTED_NOTICE_MS, withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert(() => null);
const withProvider = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;
const advance = (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });
const waitOutDelay = () => advance(CONNECTION_LOST_DELAY_MS);

// Advancing with real time too keeps notistack's transitions and findBy's polling going.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('shows nothing for a drop shorter than the delay', async () => {
  const { rerender } = render(withProvider(false));
  rerender(withProvider(true));
  await waitOutDelay();
  expect(screen.queryByText(/kapcsolat/)).not.toBeInTheDocument();
});

test('asks the team to check their last move once the socket is back, for a while', async () => {
  const { rerender } = render(withProvider(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(withProvider(true));
  await screen.findByText(/átment-e az utolsó lépésetek/);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  await advance(RECONNECTED_NOTICE_MS);
  await waitForElementToBeRemoved(() => screen.queryByText(/átment-e/));
});

test('closes what it showed when the board goes away', async () => {
  const { rerender } = render(withProvider(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(<SnackbarProvider/>);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});
