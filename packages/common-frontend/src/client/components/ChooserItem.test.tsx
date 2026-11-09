// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { ChooserItem } from './ChooserItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const startRelay = vi.fn<() => Promise<void>>();
vi.mock('../hooks/user-hooks', () => ({
  useStartRelay: () => startRelay,
  useStartStrategy: () => () => Promise.resolve(),
}));

// Regression: a double click sent two starts.
test('sends one start for a double click, and enables Start again once it answered', async () => {
  let answer: () => void = () => undefined;
  startRelay.mockImplementation(() => new Promise<void>(resolve => { answer = resolve; }));
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} hideDesc />);
  const start = screen.getByRole('button', { name: 'chooser.start' });

  fireEvent.click(start);
  fireEvent.click(start);

  expect(startRelay).toHaveBeenCalledTimes(1);
  expect(start).toBeDisabled();
  await act(async () => answer());
  expect(start).toBeEnabled();
});

// Before the clock runs, each point is a line, its details behind an ⓘ.
test('explains the strategy game in short lines, with the details behind an ⓘ each', () => {
  render(<ChooserItem type="strategy" status={{ state: 'NOT STARTED' }} />);

  expect(screen.getByText('chooser.strategy.intro')).toBeInTheDocument();
  for (const label of ['chooser.strategy.pointsLabel', 'chooser.strategy.practiceLabel', 'chooser.strategy.timeLabel']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  }
  expect(screen.getByText('chooser.strategy.noAbandon')).toBeInTheDocument();
});
