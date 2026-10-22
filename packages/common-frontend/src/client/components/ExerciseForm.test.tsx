// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  const form = (attempt: number) =>
    <SnackbarProvider>
      <ExerciseForm
        previousTries={[]}
        previousCorrectness={null}
        attempt={attempt}
        onSubmit={onSubmit}
        awaitingJudge={awaitingJudge}
      />
    </SnackbarProvider>;
  const { rerender } = render(form(4));
  return { onSubmit, moveToAttempt: (attempt: number) => rerender(form(attempt)) };
}

test('sends a guess on its turn', async () => {
  const { onSubmit } = renderForm(false);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
  fireEvent.click(screen.getByRole('button', { name: 'relay.send' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(42));
});

// #623: a second guess before the judge ruled on the first was a move out of
// turn, which boardgame.io rejected with "disallowed move: submitAnswer".
test('blocks sending and typing while the judge has the turn', () => {
  renderForm(true);
  expect(screen.getByRole('button', { name: 'relay.send' })).toBeDisabled();
  expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
});

test('focuses the input on the attempt after a guess from this screen', async () => {
  const { onSubmit, moveToAttempt } = renderForm(false);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
  // Formik submits asynchronously; act waits for it to settle.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'relay.send' }));
  });
  expect(onSubmit).toHaveBeenCalled();
  // A correct guess moves on to the next problem, three attempts on.
  moveToAttempt(7);
  expect(screen.getByRole('textbox')).toHaveFocus();
  // A teammate's guess after that leaves the focus alone again.
  moveToAttempt(10);
  expect(screen.getByRole('textbox')).not.toHaveFocus();
});

// A teammate's guess raised the keyboard on every other phone of the team.
test('leaves the input unfocused on an attempt a teammate brought on', () => {
  const { moveToAttempt } = renderForm(false);
  moveToAttempt(5);
  expect(screen.getByRole('textbox')).not.toHaveFocus();
});
