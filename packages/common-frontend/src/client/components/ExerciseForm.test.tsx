// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SnackbarProvider } from 'notistack';
import { ExerciseForm } from './ExerciseForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/user-hooks', () => ({
  useRefreshTeamState: () => () => Promise.resolve(),
}));

function renderForm(awaitingJudge: boolean) {
  const onSubmit = vi.fn(() => Promise.resolve());
  render(
    <SnackbarProvider>
      <ExerciseForm
        previousTries={[]}
        previousCorrectness={null}
        attempt={4}
        onSubmit={onSubmit}
        awaitingJudge={awaitingJudge}
      />
    </SnackbarProvider>
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
  return onSubmit;
}

test('sends a guess on its turn', async () => {
  const onSubmit = renderForm(false);
  fireEvent.click(screen.getByRole('button', { name: 'relay.send' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(42));
});

// #623: a second guess before the judge ruled on the first was a move out of
// turn, which boardgame.io rejected with "disallowed move: submitAnswer".
test('sends nothing while the judge has the turn, by button or by Enter', async () => {
  const onSubmit = renderForm(true);
  const button = screen.getByRole('button', { name: 'relay.send' });
  expect(button).toBeDisabled();
  expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  fireEvent.submit(screen.getByRole('textbox'));
  // Form resets the field after every submit, so an empty field shows the
  // submit went through.
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  expect(onSubmit).not.toHaveBeenCalled();
});
