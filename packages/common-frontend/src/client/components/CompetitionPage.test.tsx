// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { AdminRepoProvider, ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { AdminCompetitionDto } from '../dto/TeamStateDto';
import { I18nError } from '../utils/i18n-error';
import { Layout } from './Layout';
import { CompetitionPage } from './CompetitionPage';

// The task's heading is translated; without an i18next instance react-i18next
// warns on the console, which the setup file fails the test for.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const ID = 'aqvco71pta--csomag-teljes';
const OTHER = '903xajr9et--csomag-valto';
const SHARED = '10iqp4vy6b--csomag-kockak';
const metadata = { kind: 'competition', edition: 21, round: 'online', category: 'C' } as const;
const otherMetadata = { kind: 'other', label: { hu: 'Csomag: váltó' } } as const;

const competition: AdminCompetitionDto = {
  id: ID, metadata, storedIn: 'database', startWindow: null, configStartWindow: null,
  competition: {
    id: ID, languages: ['hu', 'en'], metadata,
    relay: { durationMinutes: 30, problems: [{ problemId: 'roow9oo75t--csomag-paros', points: 3 }, { problemId: SHARED, points: 4 }] },
    strategy: { durationMinutes: 20, gameId: 'minta-ketkupac' },
    advancingPoints: 10,
  },
  relayProblems: [
    {
      problem: { id: 'roow9oo75t--csomag-paros', answer: 50, content: { hu: { problemText: 'Hány páros szám?' } } },
      points: 3, storedIn: 'database',
      uses: [{ competitionId: ID, metadata, position: 1, points: 3 }],
    },
    {
      problem: {
        id: SHARED, answer: 27,
        content: { hu: { problemText: 'Hány kis kocka?' }, en: { problemText: 'How many small cubes?' } },
      },
      points: 4, storedIn: 'code',
      uses: [
        { competitionId: OTHER, metadata: otherMetadata, position: 1, points: 3 },
        { competitionId: ID, metadata, position: 2, points: 4 },
      ],
    },
  ],
  strategyGameIds: ['minta-ketkupac'],
};

let repo: MockClientRepository;

beforeEach(() => {
  repo = new MockClientRepository();
  vi.spyOn(repo, 'getCompetition').mockResolvedValue(competition);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// `Layout` merges its own theme into the surrounding one — same as in the apps.
const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

const renderPage = () => render(
  <ThemeProvider theme={outerTheme}><ClientRepoProvider value={repo}>
    <AdminRepoProvider value={repo}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <Layout>
          <CompetitionPage competitionId={ID}/>
        </Layout>
      </SWRConfig>
    </AdminRepoProvider>
  </ClientRepoProvider></ThemeProvider>,
);

const relayRows = () => within(screen.getByRole('table', { name: 'A váltó feladatai' })).getAllByRole('row').slice(1);

test('lists the relay\'s problems in play order, with points, answer, storage and missing languages', async () => {
  renderPage();

  await screen.findByRole('heading', { name: '21 online C' });
  expect(repo.getCompetition).toHaveBeenCalledWith(ID);
  expect(screen.getByText('Váltó · 2 feladat · 30 perc')).toBeInTheDocument();
  const [first, second] = relayRows();
  for (const text of ['csomag-paros', '50', 'EN hiányzik']) expect(within(first).getByText(text)).toBeInTheDocument();
  for (const text of ['csomag-kockak', '27']) expect(within(second).getByText(text)).toBeInTheDocument();
  // Marked only where it is held elsewhere than the competition.
  expect(within(first).queryByRole('img')).not.toBeInTheDocument();
  expect(within(second).getByRole('img', { name: 'Kódban tárolt feladat' })).toBeInTheDocument();
  expect(within(second).queryByText('EN hiányzik')).not.toBeInTheDocument();
});

test('shows the settings, the strategy game and the advancing points among them', async () => {
  renderPage();

  const settings = await screen.findByRole('table', { name: 'Beállítások' });
  expect(within(settings).getByText(ID)).toBeInTheDocument();
  expect(within(settings).getByText('adatbázis (az Import/export fülön került be)')).toBeInTheDocument();
  expect(within(settings).getByText('minta-ketkupac · 20 perc')).toBeInTheDocument();
  expect(within(settings).getByText('10 pont')).toBeInTheDocument();
  expect(within(settings).getByText('Magyar, Angol')).toBeInTheDocument();
});

test('"Használja" lists every use, linking each other competition to its page', async () => {
  renderPage();

  await screen.findByRole('heading', { name: '21 online C' });
  const [, second] = relayRows();
  expect(within(second).getByRole('link', { name: 'Csomag: váltó · 1. · 3 pont' }))
    .toHaveAttribute('href', `/admin/verseny/${OTHER}`);
  expect(within(second).getByText('21 online C · 2. · 4 pont')).toBeInTheDocument();
  expect(within(second).queryByRole('link', { name: /21 online C/ })).not.toBeInTheDocument();
});

test('shows every problem as a team sees it, in each of the competition\'s languages', async () => {
  const { container } = renderPage();

  await screen.findByRole('heading', { name: 'Így látja a csapat' });
  const previews = () => [1, 2].map(serial => container.querySelector(`#feladat-${serial}`)?.textContent);
  expect(previews()).toEqual([expect.stringContaining('Hány páros szám?'), expect.stringContaining('Hány kis kocka?')]);

  fireEvent.click(screen.getByRole('tab', { name: 'Angol' }));
  // The first has no English text, so an English team is shown the Hungarian.
  expect(previews()).toEqual([expect.stringContaining('Hány páros szám?'), expect.stringContaining('How many small cubes?')]);
});

test('says so when the server has no such competition', async () => {
  vi.spyOn(repo, 'getCompetition').mockRejectedValue(new I18nError('error.http.notFound'));
  renderPage();

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Versenyek' })).toHaveAttribute('href', '/admin?tab=versenyek');
});

test('links the competition to its edit page, one held in code too', async () => {
  vi.spyOn(repo, 'getCompetition').mockResolvedValue({ ...competition, storedIn: 'code' });
  renderPage();
  expect(await screen.findByRole('link', { name: 'Szerkesztés' })).toHaveAttribute('href', `/admin/verseny/${ID}/edit`);
});

test('links each relay problem to its editor, under this competition, one held in code to read', async () => {
  renderPage();
  expect(await screen.findByRole('link', { name: 'Szerkesztés: csomag-paros' }))
    .toHaveAttribute('href', `/admin/verseny/${ID}/feladat/roow9oo75t--csomag-paros`);
  expect(screen.getByRole('link', { name: `Megnyitás: ${SHARED.split('--')[1]}` }))
    .toHaveAttribute('href', `/admin/verseny/${ID}/feladat/${SHARED}`);
});

test('says the change the edit page left it for is saved, once', async () => {
  window.history.replaceState({}, '', `/admin/verseny/${ID}?mentve=1`);
  renderPage();
  expect(await screen.findByText('Mentve')).toBeInTheDocument();
  expect(window.location.search).toBe('');
});
