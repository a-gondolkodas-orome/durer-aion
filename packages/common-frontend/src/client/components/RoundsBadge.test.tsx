// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import type { MatchStatus } from 'schemas';
import '../../common/i18n';
import { RoundsBadge } from './RoundsBadge';
import type { RoundsView } from './rounds-view';

afterEach(cleanup);

const inProgress: MatchStatus = { state: 'IN PROGRESS', matchID: 'm', startAt: new Date(), endAt: new Date() };
const finished: MatchStatus = { state: 'FINISHED', matchID: 'm', score: 12, startAt: new Date(), endAt: new Date() };

const open = () => {
  fireEvent.click(screen.getByRole('button'));
  return screen.getByRole('dialog');
};

test('names the relay still to play, and where it starts', () => {
  const view: RoundsView = { current: { type: 'strategy', status: inProgress }, other: { type: 'relay', status: { state: 'NOT STARTED' } } };
  render(<RoundsBadge view={view}/>);

  expect(screen.getByRole('button')).toHaveTextContent('Váltó: még hátra');
  const list = open();
  expect(within(list).getByText('Stratégiás játék')).toBeInTheDocument();
  expect(within(list).getByText('most')).toBeInTheDocument();
  expect(within(list).getByText('Ha itt végeztetek, a váltót a kezdőlapról indíthatjátok.')).toBeInTheDocument();
});

test('scores the finished strategy match, and calls the relay the last round', () => {
  const view: RoundsView = { current: { type: 'relay', status: inProgress }, other: { type: 'strategy', status: finished } };
  render(<RoundsBadge view={view}/>);

  expect(screen.getByRole('button')).toHaveTextContent('Stratégia: 12 pont');
  const list = open();
  expect(within(list).getByText('kész · 12 pont')).toBeInTheDocument();
  expect(within(list).getByText(/Ez az utolsó fordulótok/)).toBeInTheDocument();
});

test('on a phone, shows only the short name and says the rest to a screen reader', () => {
  const view: RoundsView = { current: { type: 'strategy', status: inProgress }, other: { type: 'relay', status: { state: 'NOT STARTED' } } };
  render(<RoundsBadge view={view} compact/>);

  const badge = screen.getByRole('button', { name: 'Fordulók: Váltó, még hátra' });
  expect(badge).toHaveTextContent(/^Váltó$/);
});

// #111: the strategy round may be ended from here, while its board offers it.
test('offers to end the round only when asked to, and closes as it does', () => {
  const view: RoundsView = { current: { type: 'strategy', status: inProgress }, other: { type: 'relay', status: { state: 'NOT STARTED' } } };
  const onEndRound = vi.fn();
  render(<RoundsBadge view={view} onEndRound={onEndRound}/>);

  fireEvent.click(within(open()).getByRole('button', { name: 'Stratégiás játék befejezése…' }));

  expect(onEndRound).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('offers no end of the round by default', () => {
  const view: RoundsView = { current: { type: 'strategy', status: inProgress }, other: { type: 'relay', status: { state: 'NOT STARTED' } } };
  render(<RoundsBadge view={view}/>);

  expect(within(open()).queryByRole('button')).not.toBeInTheDocument();
});
