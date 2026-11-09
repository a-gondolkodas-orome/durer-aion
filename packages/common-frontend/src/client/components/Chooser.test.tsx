// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { PublicCompetition } from 'schemas';
import type { TeamModelDto } from '../dto/TeamStateDto';
import { Chooser } from './Chooser';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../client-repo-context', () => ({
  useClientRepo: () => ({ version: 'ONLINE' }),
}));
vi.mock('./ChooserItem', () => ({
  ChooserItem: (props: { type: string }) => <div>{`item:${props.type}`}</div>,
}));

const relayOnly: PublicCompetition = {
  id: 'aaaaaaaaaa--relay-only',
  languages: ['hu'],
  relay: { durationMinutes: 60 },
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
