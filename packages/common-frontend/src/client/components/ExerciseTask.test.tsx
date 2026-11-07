// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseTask } from './ExerciseTask';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const task = (pictureUrl: string | null) =>
  <ExerciseTask task="" serial={1} availablePoints={3} pictureUrl={pictureUrl} />;

test('clicking the task image zooms it in place, and clicking again zooms it back out', () => {
  render(task('https://example.com/figure.png'));
  const toggle = screen.getByRole('button', { name: 'relay.taskImage' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('the next task\'s image starts fitted, not zoomed', () => {
  const { rerender } = render(task('https://example.com/first.png'));
  fireEvent.click(screen.getByRole('button', { name: 'relay.taskImage' }));

  rerender(task('https://example.com/second.png'));
  expect(screen.getByRole('button', { name: 'relay.taskImage' })).toHaveAttribute('aria-pressed', 'false');
});

test('a task without an image shows no zoom control or hint', () => {
  render(task(null));
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('relay.zoomImage')).not.toBeInTheDocument();
});
