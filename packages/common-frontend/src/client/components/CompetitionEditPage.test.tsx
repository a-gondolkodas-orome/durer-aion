// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import type { CompetitionConfig } from 'schemas';
import { AdminRepoProvider, ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import type { AdminCompetitionDto, CompetitionWriteResultDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { CompetitionEditPage } from './CompetitionEditPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const ID = 'aqvco71pta--csomag-teljes';
const metadata = { kind: 'competition', edition: 21, round: 'online', category: 'C' } as const;
const config: CompetitionConfig = {
  id: ID, languages: ['hu'], metadata,
  relay: { durationMinutes: 30, problems: [{ problemId: 'roow9oo75t--csomag-paros', points: 3 }] },
  strategy: { durationMinutes: 20, gameId: 'minta-ketkupac' },
};
const competition: AdminCompetitionDto = {
  id: ID, metadata, storedIn: 'database', startWindow: null, configStartWindow: null,
  competition: config, relayProblems: [], strategyGameIds: ['minta-ketkupac', 'minta-masik'],
};
const clean: CompetitionWriteResultDto = { written: false, errors: [], warnings: [], started: false };

let repo: MockClientRepository;
const assign = vi.fn();

beforeEach(() => {
  repo = new MockClientRepository();
  vi.spyOn(repo, 'getCompetition').mockResolvedValue(competition);
  vi.spyOn(repo, 'saveCompetition').mockImplementation((_, { dryRun }) =>
    Promise.resolve(dryRun ? clean : { ...clean, written: true }));
  vi.stubGlobal('location', { ...window.location, assign });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  assign.mockReset();
});

const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

const renderPage = () => render(
  <ThemeProvider theme={outerTheme}><ClientRepoProvider value={repo}>
    <AdminRepoProvider value={repo}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <Layout>
          <CompetitionEditPage competitionId={ID}/>
        </Layout>
      </SWRConfig>
    </AdminRepoProvider>
  </ClientRepoProvider></ThemeProvider>,
);

const field = (name: string) => screen.getByRole('textbox', { name });
const type = (name: string, value: string) => { fireEvent.change(field(name), { target: { value } }); };
/// Whether the page asks the browser to confirm leaving it.
const leavePrevented = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};
const next = () => { fireEvent.click(screen.getByRole('button', { name: 'Tovább: ellenőrzés' })); };

test('fills the form from the competition, and sends the changes on to a dry run, then a save', async () => {
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  expect(field('Kiadás')).toHaveValue('21');
  expect(field('Kategória')).toHaveValue('C');
  expect(screen.queryByText('● Mentetlen változások')).not.toBeInTheDocument();

  type('Kategória', 'D');
  type('Továbbjutási pontszám (nem kötelező)', '12');
  fireEvent.click(screen.getByRole('checkbox', { name: 'angol' }));
  expect(screen.getByText('● Mentetlen változások')).toBeInTheDocument();
  next();

  const changed: CompetitionConfig = {
    ...config, languages: ['hu', 'en'], advancingPoints: 12, metadata: { ...metadata, category: 'D' },
  };
  const rules = await screen.findByRole('region', { name: 'Amit a csapat a szabályok oldalon lát' });
  expect(repo.saveCompetition).toHaveBeenLastCalledWith(changed, { dryRun: true });
  expect(within(rules).getByText('magyar és angol, a csapat választ')).toBeInTheDocument();
  expect(within(rules).getByText('1 feladat, 30 perc, összesen 3 pont (3)')).toBeInTheDocument();
  expect(within(rules).getByText('12 ponttól')).toBeInTheDocument();

  let promptedOnSave: boolean | undefined;
  assign.mockImplementation(() => { promptedOnSave = leavePrevented(); });
  fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));
  expect(await screen.findByText('Mentve')).toBeInTheDocument();
  expect(assign).toHaveBeenCalledWith(`/admin/verseny/${ID}`);
  // Asked as the page is left, before React renders the saved state.
  expect(promptedOnSave).toBe(false);
  expect(repo.saveCompetition).toHaveBeenLastCalledWith(changed, { dryRun: false });
});

test('shows the server\'s errors and warnings, and saves nothing while there is an error', async () => {
  vi.spyOn(repo, 'saveCompetition').mockResolvedValue({
    ...clean, started: true,
    errors: ['A stratégiás játék nem vehető el: már indult csapat ebben a versenyben.'],
    warnings: ['Már indult csapat ebben a versenyben.'],
  });
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Van stratégiás játék' }));
  next();

  const errors = await screen.findByRole('region', { name: '1 hiba, ezek miatt még nem menthető' });
  expect(within(errors).getByText(/nem vehető el/)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: '1 figyelmeztetés' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mentés' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Vissza: beállítások' }));
  expect(screen.getByRole('checkbox', { name: 'Van stratégiás játék' })).not.toBeChecked();
});

test('goes on to the review only once something has changed', async () => {
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  const nextButton = screen.getByRole('button', { name: 'Tovább: ellenőrzés' });
  expect(nextButton).toBeDisabled();
  expect(screen.getByText('Még nincs mit menteni.')).toBeInTheDocument();

  type('Kategória', 'D');
  expect(nextButton).toBeEnabled();
  type('Kategória', 'C');
  expect(nextButton).toBeDisabled();
});

test('fills a window field with the current time', async () => {
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  fireEvent.click(screen.getByRole('button', { name: 'Indítás ettől: most' }));
  expect((field('Indítás ettől') as HTMLInputElement).value).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d[+-]\d\d:\d\d$/);
});

// A regression: the review read an unparseable window time out as a date,
// which threw, and the page fell to the error boundary.
test('reviews a window the server will refuse, a close with no start, without breaking', async () => {
  vi.spyOn(repo, 'saveCompetition').mockResolvedValue({ ...clean, errors: ['verseny: a kezdete hibás'] });
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  fireEvent.click(screen.getByRole('button', { name: 'Indítás eddig: most' }));
  next();

  const rules = await screen.findByRole('region', { name: 'Amit a csapat a szabályok oldalon lát' });
  expect(within(rules).getByText(/^hibás:/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mentés' })).toBeDisabled();
});

test('stays on the form, naming the field, while a number field holds no number', async () => {
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  type('Kiadás', 'huszonegy');
  next();
  expect(await screen.findByText('Egész számot írj ide.')).toBeInTheDocument();
  expect(repo.saveCompetition).not.toHaveBeenCalled();
});

test('warns before leaving with unsaved changes, and not without', async () => {
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  expect(leavePrevented()).toBe(false);
  type('Kategória', 'D');
  expect(leavePrevented()).toBe(true);
});

test('of a competition held in code, offers its start window alone, starting from the one in force', async () => {
  const codeWindow = { opensAt: '2099-01-01T14:00+01:00' };
  const setApart = { opensAt: '2099-02-01T14:00+01:00' };
  vi.spyOn(repo, 'getCompetition').mockResolvedValue({
    ...competition, storedIn: 'code', competition: { ...config, startWindow: codeWindow },
    startWindow: setApart, configStartWindow: codeWindow,
  });
  renderPage();
  await screen.findByRole('heading', { name: '21 online C' });
  expect(screen.getByRole('note')).toHaveTextContent('csak telepítéssel változik');
  for (const name of ['Kiadás', 'Kategória', 'Továbbjutási pontszám (nem kötelező)']) expect(field(name)).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Van stratégiás játék' })).toBeDisabled();
  expect(field('Indítás ettől')).toHaveValue(setApart.opensAt);

  fireEvent.click(screen.getByRole('button', { name: 'Vissza a kódbeli ablakhoz' }));
  expect(field('Indítás ettől')).toHaveValue(codeWindow.opensAt);
  type('Indítás ettől', '2099-03-01T14:00+01:00');
  next();

  await screen.findByRole('region', { name: 'Amit a csapat a szabályok oldalon lát' });
  expect(repo.saveCompetition).toHaveBeenLastCalledWith(
    { ...config, startWindow: { opensAt: '2099-03-01T14:00+01:00' } }, { dryRun: true });
});
