// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { ConnectionAlert } from './ConnectionAlert';

const withProvider = (isConnected: boolean) =>
  <SnackbarProvider><ConnectionAlert isConnected={isConnected} /></SnackbarProvider>;

test('shows nothing while the socket has stayed up', () => {
  render(withProvider(true));
  expect(screen.queryByText(/kapcsolat/)).not.toBeInTheDocument();
});

test('asks the team to check their last move once the socket is back, until they close it', async () => {
  const { rerender } = render(withProvider(false));
  expect(await screen.findByText(/Megszakadt a kapcsolat/)).toBeInTheDocument();

  rerender(withProvider(true));
  expect(await screen.findByText(/átment-e az utolsó lépésetek/)).toBeInTheDocument();
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
  await waitForElementToBeRemoved(() => screen.queryByText(/átment-e/));
});

test('closes what it showed when the board goes away', async () => {
  const { rerender } = render(withProvider(false));
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(<SnackbarProvider />);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});
