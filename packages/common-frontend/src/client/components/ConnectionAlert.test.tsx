// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { CONNECTION_LOST_DELAY_MS, withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert(() => null);
const withProvider = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;
const waitOutDelay = () => act(async () => { vi.advanceTimersByTime(CONNECTION_LOST_DELAY_MS); });

// Advancing with real time too keeps notistack's transitions and findBy's polling going.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('shows nothing for a drop shorter than the delay', async () => {
  const { rerender } = render(withProvider(false));
  rerender(withProvider(true));
  await waitOutDelay();
  expect(screen.queryByText(/kapcsolat/)).not.toBeInTheDocument();
});

test('asks the team to check their last move once the socket is back, until they close it', async () => {
  const { rerender } = render(withProvider(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(withProvider(true));
  await screen.findByText(/átment-e az utolsó lépésetek/);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
  await waitForElementToBeRemoved(() => screen.queryByText(/átment-e/));
});

test('closes what it showed when the board goes away', async () => {
  const { rerender } = render(withProvider(false));
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(<SnackbarProvider/>);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});
