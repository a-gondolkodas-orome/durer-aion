// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { CONNECTION_LOST_DELAY_MS, withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert((_: { isConnected: boolean }) => <button>Lépés</button>);
const board = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;
const waitOutDelay = () => act(async () => { vi.advanceTimersByTime(CONNECTION_LOST_DELAY_MS); });
// jsdom ignores inert, so read the attribute.
const isInert = () => screen.getByRole('button').closest('[inert]') !== null;

// Real time keeps advancing too, for notistack's transitions and findBy's polling.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('a drop shorter than the delay changes nothing', async () => {
  const { rerender } = render(board(true));
  rerender(board(false));
  rerender(board(true));
  await waitOutDelay();
  expect(screen.queryByText(/Megszakadt a kapcsolat/)).not.toBeInTheDocument();
  expect(isInert()).toBe(false);

  // A new drop restarts the delay.
  rerender(board(false));
  expect(isInert()).toBe(false);
});

test('a longer drop disables the board and says why until the socket is back', async () => {
  const { rerender } = render(board(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);
  expect(isInert()).toBe(true);

  rerender(board(true));
  expect(isInert()).toBe(false);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  rerender(board(false));
  expect(isInert()).toBe(false);
});
