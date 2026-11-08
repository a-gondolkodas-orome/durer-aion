// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseTask } from './ExerciseTask';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const task = (pictureUrl: string | null) =>
  <ExerciseTask task="" serial={1} availablePoints={3} pictureUrl={pictureUrl} />;

const enlarge = () => fireEvent.click(screen.getByRole('button', { name: 'relay.taskImage' }));

test('clicking the task image enlarges it, and clicking it again shrinks it back', async () => {
  render(task('https://example.com/figure.png'));
  enlarge();
  const enlarged = within(screen.getByRole('dialog')).getByRole('img', { name: 'relay.taskImage' });
  expect(enlarged).toHaveAttribute('src', 'https://example.com/figure.png');

  fireEvent.click(enlarged);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('the close button shrinks the enlarged image back', async () => {
  render(task('https://example.com/figure.png'));
  enlarge();
  fireEvent.click(screen.getByRole('button', { name: 'general.close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('a task without an image shows no image button or hint', () => {
  render(task(null));
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('relay.zoomImage')).not.toBeInTheDocument();
});
