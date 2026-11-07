// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseTask } from './ExerciseTask';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

test('the task image opens in a new tab, for the browser to zoom', () => {
  const url = 'https://example.com/figure.png';
  render(<ExerciseTask task="" serial={1} availablePoints={3} pictureUrl={url} />);
  const link = screen.getByRole('link', { name: 'relay.taskImage' });
  expect(link).toHaveAttribute('href', url);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
});

test('a task without an image shows no link or hint', () => {
  render(<ExerciseTask task="" serial={1} availablePoints={3} pictureUrl={null} />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByText('relay.enlargeImage')).not.toBeInTheDocument();
});
