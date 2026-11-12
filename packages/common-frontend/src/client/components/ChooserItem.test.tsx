// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { ChooserItem } from './ChooserItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, values?: object) => values ? `${key} ${JSON.stringify(values)}` : key }),
  Trans: (props: { i18nKey: string, values?: object }) => props.values ? `${props.i18nKey} ${JSON.stringify(props.values)}` : null,
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

// The server refuses a start outside the team's start window.
test('keeps Start disabled while the round may not start', () => {
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} canStart={false} />);

  expect(screen.getByRole('button', { name: 'chooser.start' })).toBeDisabled();
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

// Before the clock runs, each point is a line, with a quieter line under the
// ones that need explaining; nothing is behind a tooltip (#769).
test('explains the strategy game in short lines, the details in sight', () => {
  render(<ChooserItem type="strategy" status={{ state: 'NOT STARTED' }} />);

  expect(screen.getByText('chooser.strategy.intro')).toBeInTheDocument();
  expect(screen.getByText(/strategy\.points\.cleanRun/)).toBeInTheDocument();
  expect(screen.getByText('chooser.strategy.practiceHint')).toBeInTheDocument();
  // No ⓘ: the card's buttons are the fold toggle and the start.
  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(screen.getByText('chooser.strategy.noAbandon')).toBeInTheDocument();
});

test('explains the relay the same way', () => {
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} />);

  expect(screen.getByText('chooser.relay.intro')).toBeInTheDocument();
  expect(screen.getByText(/^chooser\.relay\.triesHint/)).toBeInTheDocument();
  expect(screen.getByText('chooser.relay.noReturn')).toBeInTheDocument();
});

// The button's click bubbles to the row, which does the toggling: a handler on
// the button as well would fold and unfold in one click.
test('the fold button folds the description once per click', () => {
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} />);
  const fold = screen.getByRole('button', { name: 'relay.name' });

  expect(fold).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(fold);
  expect(fold).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(fold);
  expect(fold).toHaveAttribute('aria-expanded', 'true');
});

// The wording is the translations'; the numbers are the team's competition's.
test("fills the relay's rules in with the team's competition's numbers", () => {
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} competition={{
    id: 'aaaaaaaaaa--short',
    languages: ['hu'],
    relay: { durationMinutes: 45, problemPoints: [2, 5, 3] },
    metadata: { kind: 'other', label: { hu: 'Rövid' } },
  }} />);

  expect(screen.getByText('chooser.relay.points {"total":10,"min":2,"max":5}')).toBeInTheDocument();
  expect(screen.getByText('chooser.relay.tries {"tries":3}')).toBeInTheDocument();
  expect(screen.getByText('chooser.relay.time {"minutes":45}')).toBeInTheDocument();
});

test("fills the strategy game's time in from the team's competition", () => {
  render(<ChooserItem type="strategy" status={{ state: 'NOT STARTED' }} competition={{
    id: 'aaaaaaaaaa--short',
    languages: ['hu'],
    strategy: { durationMinutes: 20, gameId: '20o-e' },
    metadata: { kind: 'other', label: { hu: 'Rövid' } },
  }} />);

  expect(screen.getByText('chooser.strategy.time {"minutes":20}')).toBeInTheDocument();
});
