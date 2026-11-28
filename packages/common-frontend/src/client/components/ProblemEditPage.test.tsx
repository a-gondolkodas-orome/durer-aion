// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import type { Problem } from 'schemas';
import { AdminRepoProvider, ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import type { AdminProblemDto, ProblemWriteResultDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { ProblemEditPage } from './ProblemEditPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const COMPETITION = 'aqvco71pta--csomag-teljes';
const ID = '10iqp4vy6b--csomag-kockak';
const problem: Problem = {
  id: ID, answer: 27,
  content: {
    hu: { problemText: 'Hány kis kockából áll?', imageUrl: 'https://durerinfo.hu/kocka.png' },
    en: { problemText: 'How many small cubes?' },
  },
};
const uses = [
  { competitionId: '903xajr9et--csomag-valto', metadata: { kind: 'other', label: { hu: 'Gyakorló váltó' } }, position: 1, points: 3 },
  { competitionId: COMPETITION, metadata: { kind: 'competition', edition: 21, round: 'online', category: 'C' }, position: 2, points: 4 },
] as const satisfies AdminProblemDto['uses'];
const stored: AdminProblemDto = { problem, storedIn: 'database', uses: [...uses], answerLocked: false };
const clean: ProblemWriteResultDto = { written: false, errors: [], warnings: [], answerLocked: false, uses: [...uses] };

let repo: MockClientRepository;
const assign = vi.fn();

beforeEach(() => {
  repo = new MockClientRepository();
  vi.spyOn(repo, 'getProblem').mockResolvedValue(stored);
  vi.spyOn(repo, 'saveProblem').mockImplementation((_, { dryRun }) =>
    Promise.resolve(dryRun ? clean : { ...clean, written: true }));
  vi.stubGlobal('location', { ...window.location, assign });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  assign.mockReset();
});

const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

const renderPage = async () => {
  render(
    <ThemeProvider theme={outerTheme}><ClientRepoProvider value={repo}>
      <AdminRepoProvider value={repo}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <Layout>
            <ProblemEditPage competitionId={COMPETITION} problemId={ID}/>
          </Layout>
        </SWRConfig>
      </AdminRepoProvider>
    </ClientRepoProvider></ThemeProvider>,
  );
  await screen.findByRole('heading', { name: 'csomag-kockak' });
};

const field = (name: string) => screen.getByRole('textbox', { name });
const type = (name: string, value: string) => { fireEvent.change(field(name), { target: { value } }); };
const next = () => { fireEvent.click(screen.getByRole('button', { name: 'Tovább: ellenőrzés' })); };
const leavePrevented = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

test('fills the form from the problem, lists what it reaches, and saves a fix after a dry run', async () => {
  await renderPage();
  expect(field('Válasz')).toHaveValue('27');
  expect(field('Szöveg (LaTeX), magyar')).toHaveValue('Hány kis kockából áll?');
  expect(field('Kép címe, magyar (nem kötelező)')).toHaveValue('https://durerinfo.hu/kocka.png');
  expect(field('Szöveg (LaTeX), angol')).toHaveValue('How many small cubes?');
  const reaches = screen.getByRole('region', { name: 'Ezekre a versenyekre hat ki' });
  expect(within(reaches).getByRole('link', { name: 'Gyakorló váltó · 1. feladat · 3 pont' })).toBeInTheDocument();
  expect(within(reaches).getByRole('link', { name: '21 online C · 2. feladat · 4 pont' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '21 online C' })).toHaveAttribute('href', `/admin/verseny/${COMPETITION}`);

  type('Szöveg (LaTeX), magyar', 'Hány kis kockából áll a nagy kocka?');
  type('Kép címe, angol (nem kötelező)', ' https://durerinfo.hu/cube.png ');
  expect(screen.getByText('● Mentetlen változások')).toBeInTheDocument();
  next();

  const fixed: Problem = {
    ...problem,
    content: {
      hu: { problemText: 'Hány kis kockából áll a nagy kocka?', imageUrl: 'https://durerinfo.hu/kocka.png' },
      en: { problemText: 'How many small cubes?', imageUrl: 'https://durerinfo.hu/cube.png' },
    },
  };
  const changes = await screen.findByRole('region', { name: 'Változások' });
  expect(repo.saveProblem).toHaveBeenLastCalledWith(fixed, { dryRun: true });
  expect(within(changes).getByText('Szöveg (LaTeX) (magyar)')).toBeInTheDocument();
  expect(within(changes).getByText('Kép címe (angol)')).toBeInTheDocument();
  expect(within(changes).queryByText('Válasz')).not.toBeInTheDocument();

  let promptedOnSave: boolean | undefined;
  assign.mockImplementation(() => { promptedOnSave = leavePrevented(); });
  fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));
  await waitFor(() => { expect(assign).toHaveBeenCalledWith(`/admin/verseny/${COMPETITION}?mentve=1`); });
  expect(promptedOnSave).toBe(false);
  expect(repo.saveProblem).toHaveBeenLastCalledWith(fixed, { dryRun: false });
});

test('leaves out a language whose every field is emptied, and an emptied image', async () => {
  await renderPage();
  type('Szöveg (LaTeX), angol', '');
  type('Kép címe, magyar (nem kötelező)', '  ');
  next();
  await screen.findByRole('region', { name: 'Változások' });
  expect(repo.saveProblem).toHaveBeenLastCalledWith(
    { ...problem, content: { hu: { problemText: 'Hány kis kockából áll?' } } }, { dryRun: true });
});

test('shows the server\'s errors and warnings, and saves nothing while there is an error', async () => {
  vi.spyOn(repo, 'saveProblem').mockResolvedValue({
    ...clean,
    errors: [`feladat ${ID}: a kép címe nem teljes https:// kezdetű cím (hu): „http://durerinfo.hu/kocka.png”`],
    warnings: [`feladat ${ID}: a kép nem a szokásos tárhelyen van (hu): example.org`],
  });
  await renderPage();
  type('Kép címe, magyar (nem kötelező)', 'http://durerinfo.hu/kocka.png');
  next();

  const errors = await screen.findByRole('region', { name: '1 hiba, ezek miatt még nem menthető' });
  expect(within(errors).getByText(/nem teljes https:\/\/ kezdetű cím/)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: '1 figyelmeztetés' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mentés' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Vissza: feladat' }));
  expect(field('Kép címe, magyar (nem kötelező)')).toHaveValue('http://durerinfo.hu/kocka.png');
});

test('warns of an image that does not load in the preview, on the form and in the review', async () => {
  await renderPage();
  const [image] = within(screen.getByRole('region', { name: 'Így látja a csapat, magyar' })).getAllByRole('img');
  fireEvent.error(image);
  expect(screen.getByText('A kép nem töltődik be a böngészőben.')).toBeInTheDocument();

  type('Szöveg (LaTeX), angol', 'How many cubes?');
  next();
  const warnings = await screen.findByRole('region', { name: '1 figyelmeztetés' });
  expect(within(warnings).getByText('A kép nem töltődik be a böngészőben (magyar): https://durerinfo.hu/kocka.png'))
    .toBeInTheDocument();
  // A warning alone does not stop the save.
  expect(screen.getByRole('button', { name: 'Mentés' })).toBeEnabled();
});

test('keeps a locked answer, saying why, and lets the text change', async () => {
  vi.spyOn(repo, 'getProblem').mockResolvedValue({ ...stored, answerLocked: true });
  await renderPage();
  expect(field('Válasz')).toBeDisabled();
  expect(screen.getByText('Nem változhat: már indult csapat egy versenyben, amely használja.')).toBeInTheDocument();
  expect(field('Szöveg (LaTeX), magyar')).toBeEnabled();
});

test('stays on the form while the answer is no whole number', async () => {
  await renderPage();
  type('Válasz', '27,5');
  next();
  expect(await screen.findByText('Egész számot írj ide.')).toBeInTheDocument();
  expect(repo.saveProblem).not.toHaveBeenCalled();
});

test('goes on to the review only once something has changed, and warns before leaving a change', async () => {
  await renderPage();
  const nextButton = screen.getByRole('button', { name: 'Tovább: ellenőrzés' });
  expect(nextButton).toBeDisabled();
  expect(leavePrevented()).toBe(false);
  type('Válasz', '28');
  expect(nextButton).toBeEnabled();
  expect(leavePrevented()).toBe(true);
  type('Válasz', '27');
  expect(nextButton).toBeDisabled();
});

test('shows a problem held in code read-only, with nothing to save', async () => {
  vi.spyOn(repo, 'getProblem').mockResolvedValue({ ...stored, storedIn: 'code' });
  await renderPage();
  expect(screen.getByRole('note')).toHaveTextContent('csak telepítéssel változik');
  for (const name of ['Válasz', 'Szöveg (LaTeX), magyar', 'Kép címe, angol (nem kötelező)']) expect(field(name)).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Tovább: ellenőrzés' })).not.toBeInTheDocument();
});
