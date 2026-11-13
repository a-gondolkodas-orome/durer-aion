// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { PublicCompetition } from 'schemas';
import type { TeamModelDto } from '../dto/TeamStateDto';
import { Chooser } from './Chooser';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'hu' } }),
}));
vi.mock('../client-repo-context', () => ({
  useClientRepo: () => ({ version: 'ONLINE' }),
}));
vi.mock('./ChooserItem', () => ({
  ChooserItem: (props: { type: string, canStart?: boolean }) =>
    <div>{`item:${props.type}${props.canStart === false ? ':closed' : ''}`}</div>,
}));

const relayOnly: PublicCompetition = {
  id: 'aaaaaaaaaa--relay-only',
  languages: ['hu'],
  relay: { durationMinutes: 60, problemPoints: [3, 4] },
  metadata: { kind: 'other', label: { hu: 'Csak váltó' } },
};

const finished = {
  state: 'FINISHED', score: 5, matchID: 'm', startAt: new Date('2026-11-09T12:00:00Z'), endAt: new Date('2026-11-09T13:00:00Z'),
} as const;

const team = (fields: Partial<TeamModelDto>): TeamModelDto => ({
  teamName: 'Alpha',
  category: 'C',
  credentials: 'c',
  pageState: 'HOME',
  relayMatch: { state: 'NOT STARTED' },
  strategyMatch: { state: 'NOT STARTED' },
  ...fields,
});

const renderChooser = (state: TeamModelDto) => render(
  <ThemeProvider theme={createTheme({ palette: { background: { paperOpacity: 1 } } })}>
    <Chooser state={state}/>
  </ThemeProvider>);

test('offers only the matches the team\'s competition has', () => {
  renderChooser(team({ competition: relayOnly }));

  expect(screen.getByText('item:relay')).toBeInTheDocument();
  expect(screen.queryByText('item:strategy')).not.toBeInTheDocument();
});

// The local apps serve no competition.
test('offers both matches without a competition', () => {
  renderChooser(team({}));

  expect(screen.getByText('item:relay')).toBeInTheDocument();
  expect(screen.getByText('item:strategy')).toBeInTheDocument();
});

test('calls a competition finished once its one match is', () => {
  renderChooser(team({ competition: relayOnly, relayMatch: finished }));

  expect(screen.getByText('chooser.finish.title')).toBeInTheDocument();
  expect(screen.queryByText('chooser.finish.breakdown')).not.toBeInTheDocument();
});

test('is not finished while one of two matches is left', () => {
  renderChooser(team({ relayMatch: finished }));

  expect(screen.queryByText('chooser.finish.title')).not.toBeInTheDocument();
});

describe('the start window', () => {
  afterEach(() => { vi.useRealTimers(); });
  const startWindow = { opensAt: '2026-10-20T15:00:00+02:00', closesAt: '2026-10-20T21:30:00+02:00' };

  test('says when the rounds open, and keeps them closed till then', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00Z') });
    renderChooser(team({ competition: relayOnly, startWindow }));

    expect(screen.getByText('chooser.window.notOpenYet')).toBeInTheDocument();
    expect(screen.getByText('item:relay:closed')).toBeInTheDocument();
  });

  test('says until when they open, while it is open', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T14:00:00Z') });
    renderChooser(team({ competition: relayOnly, startWindow }));

    expect(screen.getByText('chooser.window.openUntil')).toBeInTheDocument();
    expect(screen.getByText('item:relay')).toBeInTheDocument();
  });

  test('says the competition is over once it closes', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T20:00:00Z') });
    renderChooser(team({ competition: relayOnly, startWindow }));

    expect(screen.getByText('chooser.window.closed')).toBeInTheDocument();
    expect(screen.getByText('item:relay:closed')).toBeInTheDocument();
  });

  // A browser whose clock runs an hour behind the server's.
  test('goes by the server\'s clock, not the browser\'s', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T12:30:00Z') });
    renderChooser(team({ competition: relayOnly, startWindow, clockOffsetMs: 3600_000 }));

    expect(screen.getByText('chooser.window.openUntil')).toBeInTheDocument();
    expect(screen.getByText('item:relay')).toBeInTheDocument();
  });

  // Its results are what it comes back for.
  test('says nothing to a team with no round left to start', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T20:00:00Z') });
    renderChooser(team({ competition: relayOnly, startWindow, relayMatch: finished }));

    expect(screen.queryByTestId('startWindowNote')).not.toBeInTheDocument();
  });

  // The competition is over for it too: the round it did not start never will be.
  test('thanks and totals a team that played one of two rounds once the window closes', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T20:00:00Z') });
    renderChooser(team({ startWindow, relayMatch: finished }));

    expect(screen.getByText('chooser.finish.title')).toBeInTheDocument();
    expect(screen.queryByTestId('startWindowNote')).not.toBeInTheDocument();
  });

  test('does not thank a team with one of two rounds played while the window is open', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T14:00:00Z') });
    renderChooser(team({ startWindow, relayMatch: finished }));

    expect(screen.queryByText('chooser.finish.title')).not.toBeInTheDocument();
  });

  test('tells a team that played nothing only that the competition is over', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T20:00:00Z') });
    renderChooser(team({ startWindow }));

    expect(screen.queryByText('chooser.finish.title')).not.toBeInTheDocument();
    expect(screen.getByText('chooser.window.closed')).toBeInTheDocument();
  });

  test('says nothing without a window', () => {
    renderChooser(team({ competition: relayOnly, startWindow: null }));

    expect(screen.queryByTestId('startWindowNote')).not.toBeInTheDocument();
  });
});
