// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  competition: config, relayProblems: [], strategyGameIds: ['minta-ketkupac', 'minta-masik'], started: false,
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
  expect(repo.saveCompetition).toHaveBeenLastCalledWith({ competition: changed, problems: [] }, { dryRun: true });
  expect(within(rules).getByText('magyar és angol, a csapat választ')).toBeInTheDocument();
  expect(within(rules).getByText('1 feladat, 30 perc, összesen 3 pont (3)')).toBeInTheDocument();
  expect(within(rules).getByText('12 ponttól')).toBeInTheDocument();

  let promptedOnSave: boolean | undefined;
  assign.mockImplementation(() => { promptedOnSave = leavePrevented(); });
  fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));
  // Gone once the saved state renders, which comes after the page is left.
  await waitFor(() => { expect(screen.queryByText('● Mentetlen változások')).not.toBeInTheDocument(); });
  expect(assign).toHaveBeenCalledWith(`/admin/verseny/${ID}?mentve=1`);
  // Asked as the page is left, before React renders the saved state.
  expect(promptedOnSave).toBe(false);
  expect(repo.saveCompetition).toHaveBeenLastCalledWith({ competition: changed, problems: [] }, { dryRun: false });
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
    { competition: { ...config, startWindow: { opensAt: '2099-03-01T14:00+01:00' } }, problems: [] }, { dryRun: true });
});

describe('composing the relay', () => {
  const PAROS = 'roow9oo75t--csomag-paros';
  const KOCKAK = '10iqp4vy6b--csomag-kockak';
  const paros = { id: PAROS, answer: 12, content: { hu: { problemText: 'Hány páros szám van?', help1: 'Számolj!' } } };
  const kockak = { id: KOCKAK, answer: 5, content: { hu: { problemText: 'Hány kocka van?' } } };
  const use = (position: number, points: number) => ({ competitionId: ID, metadata, position, points });
  const relayConfig: CompetitionConfig = {
    ...config,
    relay: { durationMinutes: 30, problems: [{ problemId: PAROS, points: 3 }, { problemId: KOCKAK, points: 4 }] },
  };
  const composed: AdminCompetitionDto = {
    ...competition, competition: relayConfig,
    relayProblems: [
      { problem: paros, points: 3, storedIn: 'database',
        uses: [use(1, 3), { competitionId: 'zzzzzzzzzz--masik', metadata, position: 2, points: 3 }] },
      { problem: kockak, points: 4, storedIn: 'database', uses: [use(2, 4)] },
    ],
  };
  const relayList = () => screen.getByRole('list', { name: 'A váltó feladatai' });
  const click = (name: string) => { fireEvent.click(screen.getByRole('button', { name })); };
  const lastChange = () => vi.mocked(repo.saveCompetition).mock.lastCall?.[0];

  beforeEach(() => { vi.spyOn(repo, 'getCompetition').mockResolvedValue(composed); });

  test('reorders, re-points and removes the relay\'s problems', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    expect(within(relayList()).getAllByRole('listitem').map(item => item.textContent))
      .toEqual([expect.stringContaining('csomag-paros'), expect.stringContaining('csomag-kockak')]);
    expect(screen.getByRole('button', { name: 'Feljebb: 1. feladat' })).toBeDisabled();

    click('Lejjebb: 1. feladat');
    type('Pont, 1. feladat', '6');
    next();
    await screen.findByRole('region', { name: 'A váltó feladatai a mentés után' });
    expect(lastChange()).toEqual({
      competition: { ...relayConfig, relay: { durationMinutes: 30,
        problems: [{ problemId: KOCKAK, points: 6 }, { problemId: PAROS, points: 3 }] } },
      problems: [],
    });

    click('Vissza: beállítások');
    click('Eltávolítás: 2. feladat');
    next();
    const review = await screen.findByRole('region', { name: 'A váltó feladatai a mentés után' });
    expect(within(review).getByText(/Kikerül a váltóból: csomag-paros/)).toBeInTheDocument();
    expect(lastChange()?.competition.relay?.problems).toEqual([{ problemId: KOCKAK, points: 6 }]);
  });

  test('adds a new problem, written with the competition on its save', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    click('+ Új feladat');
    // Starts from the points of the one before it.
    expect(field('Pont, 3. feladat')).toHaveValue('4');
    type('Név az azonosítóban', 'uj-feladat');
    type('Válasz', '42');
    type('Szöveg (LaTeX), magyar', 'Mennyi $6 \\cdot 7$?');
    next();

    const review = await screen.findByRole('region', { name: 'A váltó feladatai a mentés után' });
    expect(within(review).getByText('· új feladat')).toBeInTheDocument();
    const change = lastChange();
    const id = change?.problems[0]?.id ?? '';
    expect(id).toMatch(/^[0-9a-z]{10}--uj-feladat$/);
    expect(change?.problems).toEqual([{ id, answer: 42, content: { hu: { problemText: 'Mennyi $6 \\cdot 7$?' } } }]);
    expect(change?.competition.relay?.problems.at(-1)).toEqual({ problemId: id, points: 4 });

    fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));
    await waitFor(() => { expect(assign).toHaveBeenCalled(); });
    expect(repo.saveCompetition).toHaveBeenLastCalledWith(change, { dryRun: false });
  });

  test('replaces a shared problem with a copy in this relay only', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    expect(within(relayList()).getByText('2 helyen használt')).toBeInTheDocument();
    click('Másolat: 1. feladat');
    expect(within(relayList()).getByText('másolat: csomag-paros')).toBeInTheDocument();
    expect(field('Név az azonosítóban')).toHaveValue('csomag-paros');
    expect(field('Válasz')).toHaveValue('12');
    type('Szöveg (LaTeX), magyar', 'Hány páratlan szám van?');
    next();

    await screen.findByRole('region', { name: 'A váltó feladatai a mentés után' });
    const change = lastChange();
    const id = change?.problems[0]?.id ?? '';
    expect(id).toMatch(/^[0-9a-z]{10}--csomag-paros$/);
    expect(id).not.toBe(PAROS);
    // The hints go with the copy, as the problem editor keeps them.
    expect(change?.problems).toEqual(
      [{ id, answer: 12, content: { hu: { problemText: 'Hány páratlan szám van?', help1: 'Számolj!' } } }]);
    expect(change?.competition.relay?.problems).toEqual([{ problemId: id, points: 3 }, { problemId: KOCKAK, points: 4 }]);
  });

  test('adds problems another relay uses, by id, and marks those already in this one', async () => {
    const HAROMSZOG = '7q1wniz55w--csomag-haromszog';
    const haromszog = { id: HAROMSZOG, answer: 9, content: { hu: { problemText: 'Hány háromszög van?' } } };
    const OTHER = 'zzzzzzzzzz--masik';
    const otherUse = { competitionId: OTHER, metadata: { ...metadata, category: 'D' }, position: 1, points: 2 };
    vi.spyOn(repo, 'getCompetitions').mockResolvedValue([
      { id: OTHER, metadata: otherUse.metadata, startWindow: null, configStartWindow: null, storedIn: 'database' },
    ]);
    const search = vi.spyOn(repo, 'searchProblems').mockImplementation(({ competition: id }) => Promise.resolve({
      truncated: false,
      problems: id === OTHER
        ? [{ problem: haromszog, storedIn: 'database', uses: [otherUse] },
          { problem: paros, storedIn: 'database', uses: [use(1, 3), { ...otherUse, position: 2 }] }]
        : [],
    }));
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    click('+ Meglévő feladat');
    const dialog = await screen.findByRole('dialog', { name: 'Meglévő feladat hozzáadása' });
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Verseny' }));
    fireEvent.click(await screen.findByRole('option', { name: '21 online D' }));
    await waitFor(() => { expect(search).toHaveBeenLastCalledWith({ q: '', competition: OTHER }); });

    const results = await within(dialog).findByRole('list', { name: 'Találatok' });
    expect(within(results).getByRole('checkbox', { name: 'Kiválasztás: csomag-paros' })).toBeDisabled();
    expect(within(results).getByText('már a váltóban')).toBeInTheDocument();
    fireEvent.click(within(results).getByRole('button', { name: 'Előnézet: csomag-haromszog' }));
    expect(within(results).getByRole('region', { name: 'Így látja a csapat: csomag-haromszog' })).toBeInTheDocument();
    fireEvent.click(within(results).getByRole('checkbox', { name: 'Kiválasztás: csomag-haromszog' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hozzáadás (1)' }));
    await waitFor(() => { expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); });

    const added = within(relayList()).getByRole('listitem', { name: '3. feladat' });
    expect(within(added).getByText('hozzáadva')).toBeInTheDocument();
    expect(within(added).getByText('Hány háromszög van?')).toBeInTheDocument();
    expect(field('Pont, 3. feladat')).toHaveValue('3');
    next();
    const review = await screen.findByRole('region', { name: 'A váltó feladatai a mentés után' });
    expect(within(review).getByText('· meglévő feladat, hozzáadva')).toBeInTheDocument();
    expect(lastChange()).toEqual({
      competition: { ...relayConfig, relay: { durationMinutes: 30,
        problems: [...relayConfig.relay?.problems ?? [], { problemId: HAROMSZOG, points: 3 }] } },
      problems: [],
    });
  });

  test('stays on the form, naming the entry, while a new problem has no slug or answer, or points are no number', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    click('+ Új feladat');
    type('Pont, 1. feladat', 'sok');
    type('Név az azonosítóban', 'Új feladat');
    next();
    expect(await screen.findByText('Kisbetűk és számok, a szavak között egy-egy kötőjel, ékezet nélkül.')).toBeInTheDocument();
    expect(field('Pont, 1. feladat')).toHaveAccessibleDescription('Egész számot írj ide.');
    expect(field('Válasz')).toHaveAccessibleDescription('Egész számot írj ide.');
    expect(repo.saveCompetition).not.toHaveBeenCalled();
  });

  test('leaves the relay as it is once a team has started', async () => {
    vi.spyOn(repo, 'getCompetition').mockResolvedValue({ ...composed, started: true });
    renderPage();
    await screen.findByRole('heading', { name: '21 online C' });
    expect(screen.getByText(/a váltó feladatai, sorrendjük és pontjuk nem változhat/)).toBeInTheDocument();
    expect(field('Pont, 1. feladat')).toBeDisabled();
    for (const name of ['+ Új feladat', '+ Meglévő feladat', 'Lejjebb: 1. feladat', 'Másolat: 1. feladat', 'Eltávolítás: 1. feladat']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    // A problem's own editor is still where its text is fixed.
    expect(screen.getByRole('link', { name: 'Szerkesztés: 1. feladat' })).toBeInTheDocument();
  });
});
