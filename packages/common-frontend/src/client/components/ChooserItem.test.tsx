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
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} />);
  const start = screen.getByRole('button', { name: 'chooser.start' });

  fireEvent.click(start);
  fireEvent.click(start);

  expect(startRelay).toHaveBeenCalledTimes(1);
  expect(start).toBeDisabled();
  await act(async () => answer());
  expect(start).toBeEnabled();
});

test('a finished round shows its results and when it was filled in, and no button', () => {
  render(<ChooserItem type="relay" status={{
    state: 'FINISHED',
    score: 4,
    matchID: 'm',
    startAt: new Date('2026-11-09T12:56:00Z'),
    endAt: new Date('2026-11-09T13:56:00Z'),
    relayResults: [{ points: 4, maxPoints: 4, trySeconds: [90] }],
  }} />);

  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByText(/chooser\.filledAt/)).toBeInTheDocument();
  // The detailed table: the time row too.
  expect(screen.getAllByText('relay.endTable.time').length).toBeGreaterThan(0);
});
