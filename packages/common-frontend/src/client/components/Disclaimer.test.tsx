// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { PublicCompetition, StartWindow } from 'schemas';
import { Disclaimer } from './Disclaimer';

vi.mock('react-i18next', () => ({
  // The options are shown beside the key, so a test sees what was filled in.
  useTranslation: () => ({
    t: (key: string, options?: object) => options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'hu' },
  }),
  Trans: (props: { i18nKey: string, values?: object }) =>
    props.values ? `${props.i18nKey} ${JSON.stringify(props.values)}` : props.i18nKey,
}));
vi.mock('../client-repo-context', () => ({
  useClientRepo: () => ({ version: 'ONLINE' }),
}));
vi.mock('../hooks/user-hooks', () => ({
  useToHome: () => () => Promise.resolve(),
}));

const onlineC: PublicCompetition = {
  id: 'mkhi1nnoim--20-online-c',
  languages: ['hu'],
  relay: { durationMinutes: 60, problemPoints: [3, 3, 4, 4, 4, 5, 5, 6, 6] },
  strategy: { durationMinutes: 30, gameId: 'minta-ketkupac' },
  advancingPoints: 25,
  metadata: { kind: 'competition', edition: 20, round: 'online', category: 'C' },
};

const practice: PublicCompetition = {
  id: 'aaaaaaaaaa--algebra',
  languages: ['hu'],
  relay: { durationMinutes: 45, problemPoints: [2, 5, 3] },
  metadata: { kind: 'other', label: { hu: 'Algebra' } },
};

const renderDisclaimer = (startWindow?: StartWindow | null, competition: PublicCompetition | null = onlineC) => render(
  <ThemeProvider theme={createTheme({ palette: { background: { paperOpacity: 1 } } })}>
    <Disclaimer teamName="Alpha" competition={competition} startWindow={startWindow}/>
  </ThemeProvider>);

afterEach(() => { vi.useRealTimers(); });

// The team reads on, rules included, before the window opens; it is told
// when the rounds start before it clicks through.
test('says when the rounds open, and still lets the team read on', () => {
  vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00Z') });
  renderDisclaimer({ opensAt: '2026-10-20T15:00:00+02:00' });

  expect(screen.getByTestId('startWindowNote')).toHaveTextContent('chooser.window.notOpenYet');
  expect(screen.getByRole('button', { name: 'disclaimer.continue' })).toBeEnabled();
});

test('says nothing without a window', () => {
  renderDisclaimer(null);

  expect(screen.queryByTestId('startWindowNote')).not.toBeInTheDocument();
});

test("states the online round's threshold out of its most points", () => {
  renderDisclaimer(null);

  expect(screen.getByText('disclaimer.progress')).toBeInTheDocument();
  expect(screen.getByText(/disclaimer\.progressDescription/)).toHaveTextContent(
    'disclaimer.progressDescriptionOnline {"minpoints":25,"maxpoints":52}');
  expect(screen.getByText('disclaimer.welcomeOnline {"tname":"Alpha"}')).toBeInTheDocument();
});

test('says nothing of advancing for a competition with no threshold, and speaks of it in general words', () => {
  renderDisclaimer(null, practice);

  expect(screen.queryByText('disclaimer.progress')).not.toBeInTheDocument();
  expect(screen.getByText('disclaimer.welcome {"tname":"Alpha"}')).toBeInTheDocument();
  expect(screen.getByText(/disclaimer\.start /)).toBeInTheDocument();
});

// The close is the last start; a match started then runs its full time.
test('tells when the competing time ends, and until when a match may start', () => {
  vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00Z') });
  renderDisclaimer({ opensAt: '2026-10-20T15:00:00Z', closesAt: '2026-10-20T19:00:00Z' });

  const time = (at: string) => new Intl.DateTimeFormat('hu', { hour: '2-digit', minute: '2-digit' }).format(new Date(at));
  const [end, close] = [time('2026-10-20T20:00:00Z'), time('2026-10-20T19:00:00Z')];
  expect(screen.getByText(/disclaimer\.start/)).toHaveTextContent(
    `"until":"disclaimer.until {\\"end\\":\\"${end}\\",\\"close\\":\\"${close}\\"}"`);
});

test('names no end time without a close', () => {
  renderDisclaimer({ opensAt: '2026-10-20T15:00:00Z' });

  expect(screen.getByText(/disclaimer\.start/)).toHaveTextContent('"until":""');
});

// The category is the competition's, and a practice set has none to name.
test("names the competition's category, and none for a practice set", () => {
  const { unmount } = renderDisclaimer(null);
  expect(screen.getByText('disclaimer.category {"category":"C"}')).toBeInTheDocument();
  unmount();

  renderDisclaimer(null, practice);
  expect(screen.queryByText(/disclaimer\.category/)).not.toBeInTheDocument();
});
