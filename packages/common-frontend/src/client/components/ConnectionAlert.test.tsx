// @vitest-environment jsdom
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import i18n from '../../common/i18n';
import { setUsageReporter } from '../utils/usage-report';
import { CONNECTION_LOST_DELAY_MS, withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert((_: { isConnected: boolean }) => <button>Lépés</button>);
const board = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;
const waitOutDelay = () => act(async () => { vi.advanceTimersByTime(CONNECTION_LOST_DELAY_MS); });
// jsdom ignores inert, so read the attribute.
const isInert = () => screen.getByRole('button').closest('[inert]') !== null;

// Real time keeps advancing too, for notistack's transitions and findBy's polling.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('disables the board and says why only once a drop outlasts the delay', async () => {
  const { rerender } = render(board(true));
  rerender(board(false));
  rerender(board(true));
  await waitOutDelay();

  rerender(board(false));
  expect(isInert()).toBe(false);
  await waitOutDelay();
  await screen.findByText(/Megszakadt a kapcsolat/);
  expect(isInert()).toBe(true);

  rerender(board(true));
  expect(isInert()).toBe(false);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  rerender(board(false));
  expect(isInert()).toBe(false);
});

test('reports each drop that outlasts the delay once, however the page changes meanwhile', async () => {
  const report = vi.fn();
  setUsageReporter(report);
  const { rerender } = render(board(true));
  rerender(board(false));
  rerender(board(true));
  await waitOutDelay();
  expect(report).not.toHaveBeenCalled();

  rerender(board(false));
  await waitOutDelay();
  await act(async () => { await i18n.changeLanguage('en'); });
  await act(async () => { await i18n.changeLanguage('hu'); });
  expect(report.mock.calls).toStrictEqual([['connection-lost', undefined]]);

  rerender(board(true));
  rerender(board(false));
  await waitOutDelay();
  expect(report).toHaveBeenCalledTimes(2);
  setUsageReporter(() => undefined);
});
