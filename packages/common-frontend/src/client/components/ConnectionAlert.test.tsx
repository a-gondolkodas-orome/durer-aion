// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { CONNECTION_LOST_DELAY_MS, withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert((_: { isConnected: boolean }) => <button>Lépés</button>);
const withProvider = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;
const waitOutDelay = () => act(async () => { vi.advanceTimersByTime(CONNECTION_LOST_DELAY_MS); });
// jsdom does not implement inert, so the tests read the attribute rather than click.
const isInert = () => screen.getByRole('button', { name: 'Lépés' }).closest('[inert]') !== null;

// Advancing with real time too keeps notistack's transitions and findBy's polling going.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('shows nothing for a drop shorter than the delay', async () => {
  const { rerender } = render(withProvider(false));
  rerender(withProvider(true));
  await waitOutDelay();
  expect(screen.queryByText(/kapcsolat/)).not.toBeInTheDocument();
  expect(isInert()).toBe(false);
});

test('disables the board and says why until the socket is back', async () => {
  const { rerender } = render(withProvider(false));
  expect(isInert()).toBe(false);
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);
  expect(isInert()).toBe(true);

  rerender(withProvider(true));
  expect(isInert()).toBe(false);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});

test('closes the snackbar when the board goes away', async () => {
  const { rerender } = render(withProvider(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(<SnackbarProvider/>);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});
