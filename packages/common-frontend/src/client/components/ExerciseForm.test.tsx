// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// The form reads its messages off i18next, which the apps initialise by
// importing this module.
import '../../common/i18n';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ExerciseForm } from './ExerciseForm';

const refreshState = vi.fn();
vi.mock('../hooks/user-hooks', () => ({
  useRefreshTeamState: () => refreshState,
}));

// The form logs the failure it reports; the run's output is meant to have
// itself, so the test takes the calls instead (see vitest.setup.mts).
let logged: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  refreshState.mockReset();
});

const renderForm = (onSubmit: (result: number) => Promise<void>) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SnackbarProvider>
        <ExerciseForm previousTries={[]} previousCorrectness={null} attempt={3} onSubmit={onSubmit} />
      </SnackbarProvider>
    </ThemeProvider>
  );

const answer = (value: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  fireEvent.click(screen.getByRole('button'));
};

test('a submitted answer reaches the handler, and the team state is refreshed', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderForm(onSubmit);

  answer('120');

  await waitFor(() => expect(onSubmit.mock.calls).toStrictEqual([[120]]));
  await waitFor(() => expect(refreshState).toHaveBeenCalled());
  expect(screen.queryByText(/hiba/i)).not.toBeInTheDocument();
});

test('a rejected submission is reported and does not refresh the team state', async () => {
  renderForm(vi.fn().mockRejectedValue(new Error('megszakadt a kapcsolat')));

  answer('120');

  expect(await screen.findByText('megszakadt a kapcsolat')).toBeInTheDocument();
  expect(refreshState).not.toHaveBeenCalled();
  expect(logged).toHaveBeenCalled();
});

// Regression: the handler used to be called outside the try, with `.catch`
// attached to what it returned, so a handler that threw before returning a
// promise escaped the form as an unhandled exception instead of being shown.
test('a handler that throws synchronously is reported the same way', async () => {
  renderForm(vi.fn().mockImplementation(() => { throw new Error('nincs ilyen lépés'); }));

  answer('120');

  expect(await screen.findByText('nincs ilyen lépés')).toBeInTheDocument();
  expect(refreshState).not.toHaveBeenCalled();
});

test('a guess already tried is refused without reaching the handler', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ThemeProvider theme={createTheme()}>
      <SnackbarProvider>
        <ExerciseForm previousTries={[120]} previousCorrectness={null} attempt={4} onSubmit={onSubmit} />
      </SnackbarProvider>
    </ThemeProvider>
  );

  answer('120');

  expect(await screen.findByText('Ezt a választ már próbáltátok')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
