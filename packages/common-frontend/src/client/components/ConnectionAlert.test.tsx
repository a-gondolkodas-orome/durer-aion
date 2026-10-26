// @vitest-environment jsdom
import { test } from 'vitest';
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import '../../common/i18n';
import { withConnectionAlert } from './ConnectionAlert';

const Board = withConnectionAlert(() => null);
const withProvider = (isConnected: boolean) => <SnackbarProvider><Board isConnected={isConnected}/></SnackbarProvider>;

test('asks the team to check their last move once the socket is back, until they close it', async () => {
  const { rerender } = render(withProvider(false));
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(withProvider(true));
  await screen.findByText(/átment-e az utolsó lépésetek/);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));

  fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
  await waitForElementToBeRemoved(() => screen.queryByText(/átment-e/));
});

test('closes what it showed when the board goes away', async () => {
  const { rerender } = render(withProvider(false));
  await screen.findByText(/Megszakadt a kapcsolat/);

  rerender(<SnackbarProvider/>);
  await waitForElementToBeRemoved(() => screen.queryByText(/Megszakadt a kapcsolat/));
});
