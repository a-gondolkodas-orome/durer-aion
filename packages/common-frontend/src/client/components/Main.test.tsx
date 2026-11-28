// @vitest-environment jsdom
import React from 'react';
import { MockTeamState } from '../hooks/mock-user-hooks';
import { render } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
// `Main` calls `i18next.changeLanguage` while rendering, so i18next has to be
// initialised the same way the apps initialise it: by importing this module.
import '../../common/i18n';
import { AdminRepoProvider, ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { ThemeProvider } from '@mui/material/styles';
import { Main, adminPath } from './Main';
import i18next from 'i18next';

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

vi.mock('../hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

// What this file is about is which page `Main` puts up, not what the admin page
// holds — and the real one renders a data grid jsdom cannot lay out.
vi.mock('./Admin', () => ({
  Admin: () => <div data-testid="adminRoot" />,
}));

// `Main` reads the path once, on mount, so each test below sets it before
// rendering; this puts it back for the ones that expect a team's own page.
afterEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
});

// `Layout` merges its own theme into the surrounding one, so `Main` needs an
// outer theme to merge with — the apps pass their accent colour here.
const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

// `Header` reads the client repository off context, so `Main` cannot render
// outside a provider — same as in the apps. The admin repository is the online
// app's alone; `{ admin: false }` renders as the local apps do.
const renderMain = (options: { admin: boolean } = { admin: true }) => {
  const repo = new MockClientRepository();
  const main = <Main gitCommitHash="0123456789abcdef" />;
  return render(
    <ThemeProvider theme={outerTheme}>
      <ClientRepoProvider value={repo}>
        {options.admin ? <AdminRepoProvider value={repo}>{main}</AdminRepoProvider> : main}
      </ClientRepoProvider>
    </ThemeProvider>
  );
};

beforeEach(() => {
  MockTeamState.mockLoggedOut();
});

test('renders', () => {
  const { getByTestId } = renderMain();
  expect(getByTestId("mainRoot")).toBeInTheDocument();
});

test('main renders login if team is not logged in', () => {
  const { getByTestId, getByRole } = renderMain();
  expect(getByTestId("loginRoot")).toBeInTheDocument();
  // The code field is named by its label, not only by the example inside it.
  expect(getByRole('textbox')).toHaveAccessibleName();
});

test('main renders chooser if team is in HOME state', () => {
  MockTeamState.mockHome();
  const { getByTestId } = renderMain();
  expect(getByTestId("chooserRoot")).toBeInTheDocument();
});

test('main renders disclaimer if team is in DISCLAIMER state', () => {
  MockTeamState.mockDisclaimer();
  const { getByTestId } = renderMain();
  expect(getByTestId("disclaimerRoot")).toBeInTheDocument();
});

test('main renders Relay if team is in RELAY state', () => {
  MockTeamState.mockRelay();
  const { getByTestId } = renderMain();
  expect(getByTestId("relayRoot")).toBeInTheDocument();
});

test('main renders Strategy if team is in STRATEGY state', () => {
  MockTeamState.mockStrategy();
  const { getByTestId } = renderMain();
  expect(getByTestId("strategyRoot")).toBeInTheDocument();
});

// These two were independent conditions, so `/admin` rendered the admin page
// *and* whatever the browser's own session was entitled to underneath it.
test('the admin page is the whole page, not a panel above the login form', async () => {
  MockTeamState.mockLoggedOut();
  window.history.replaceState({}, '', '/admin');

  const { findByTestId, queryByTestId } = renderMain();

  expect(await findByTestId('adminRoot')).toBeInTheDocument();
  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();
});

// The worse half: an organiser who tested a team account still holds its
// session, and the team's board is live and playable when it renders.
test('an organiser still holding a team session is not handed that team\'s board', async () => {
  MockTeamState.mockRelay();
  window.history.replaceState({}, '', '/admin/8eae8669-125c-42e5-8b49-89afbac31679');

  const { findByTestId, queryByTestId } = renderMain();

  expect(await findByTestId('adminRoot')).toBeInTheDocument();
  expect(queryByTestId('relayRoot')).not.toBeInTheDocument();
});

// The dry run renders the same `Main` with no admin repository: there `/admin`
// is a path like any other, not a page whose every request would throw.
test('/admin is the team\'s own page in an app with no admin repository', () => {
  MockTeamState.mockLoggedOut();
  window.history.replaceState({}, '', '/proba-verseny/admin');

  const { getByTestId, queryByTestId } = renderMain({ admin: false });

  expect(getByTestId('loginRoot')).toBeInTheDocument();
  expect(queryByTestId('adminRoot')).not.toBeInTheDocument();
});

test('a team away from /admin still gets its own page', () => {
  MockTeamState.mockRelay();

  const { getByTestId, queryByTestId } = renderMain();

  expect(getByTestId('relayRoot')).toBeInTheDocument();
  expect(queryByTestId('adminRoot')).not.toBeInTheDocument();
});

// The admin pages are written in Hungarian only; switching to English turned
// the header and the team dialog's result tables English, and nothing else.
test('the admin page offers no language switcher', async () => {
  window.history.replaceState({}, '', '/admin');

  const { findByTestId, queryByText } = renderMain();
  await findByTestId('adminRoot');

  expect(queryByText('Magyar')).not.toBeInTheDocument();
});

test('a team in a competition held in both languages gets the switcher', () => {
  MockTeamState.mockHomeIn(['hu', 'en']);
  const { getAllByText } = renderMain();
  expect(getAllByText('Magyar').length).toBeGreaterThan(0);
  expect(i18next.language).toBe('hu');
});

test('a team in a competition held in both plays in the language it chose', () => {
  localStorage.setItem('lang', 'en');
  MockTeamState.mockHomeIn(['hu', 'en']);
  const { getAllByText } = renderMain();
  expect(getAllByText('English').length).toBeGreaterThan(0);
  expect(i18next.language).toBe('en');
});

test('a competition held in English alone is shown in English, with no switcher', () => {
  MockTeamState.mockHomeIn(['en']);
  const { queryByText } = renderMain();
  expect(i18next.language).toBe('en');
  expect(queryByText('English')).not.toBeInTheDocument();
});

test('a choice the competition does not have is ignored', () => {
  localStorage.setItem('lang', 'en');
  MockTeamState.mockHomeIn(['hu']);
  renderMain();
  expect(i18next.language).toBe('hu');
});

test('the login page is Hungarian with no choice', () => {
  renderMain();
  expect(i18next.language).toBe('hu');
});

test('the login page follows the stored choice', () => {
  localStorage.setItem('lang', 'en');
  renderMain();
  expect(i18next.language).toBe('en');
});

test('a ?lang= link outranks the stored choice, on the login page and after it', () => {
  localStorage.setItem('lang', 'hu');
  window.history.replaceState({}, '', '/?lang=en');
  renderMain();
  expect(i18next.language).toBe('en');

  MockTeamState.mockHomeIn(['hu', 'en']);
  renderMain();
  expect(i18next.language).toBe('en');
});

test('the admin page stays Hungarian under a team session in an English competition', async () => {
  MockTeamState.mockHomeIn(['en', 'hu']);
  window.history.replaceState({}, '', '/admin');
  const { findByTestId, queryByText } = renderMain();
  await findByTestId('adminRoot');
  expect(i18next.language).toBe('hu');
  expect(queryByText('English')).not.toBeInTheDocument();
});

// MUI's default `maxWidth="lg"` caps a Container at the theme's lg breakpoint,
// 1280px, overriding the 1200px in its sx: at 1280px the page then had no side
// margin at all (#112).
test('no Container takes MUI\'s lg max width over its own', () => {
  const { container } = renderMain();
  expect(container.querySelector('.MuiContainer-maxWidthLg')).toBeNull();
});

test('the logo is on the login page', () => {
  const { getByTestId } = renderMain();
  expect(getByTestId("loginLogo")).toBeInTheDocument();
});

test.each([
  ['HOME', () => MockTeamState.mockHome()],
  ['RELAY', () => MockTeamState.mockRelay()],
  ['STRATEGY', () => MockTeamState.mockStrategy()],
])('the logo is not on the page of a team in %s state', (_, mockState) => {
  mockState();
  const { queryByTestId } = renderMain();
  expect(queryByTestId("loginLogo")).toBeNull();
});

const trackingNote = /Névtelen használati statisztikát/;

test('the footer names the build by its short hash, with the tracking note on the login page', () => {
  const { getByText } = renderMain();
  expect(getByText('verzió: 0123456')).toBeInTheDocument();
  expect(getByText(trackingNote)).toBeInTheDocument();
});

test('a team past the login page keeps the version but not the tracking note', () => {
  MockTeamState.mockRelay();
  const { getByText, queryByText } = renderMain();
  expect(getByText('verzió: 0123456')).toBeInTheDocument();
  expect(queryByText(trackingNote)).not.toBeInTheDocument();
});

// An admin page loads no tracker (tracking.ts), so it has nothing to note.
test('the admin page carries no tracking note', async () => {
  window.history.replaceState({}, '', '/admin');
  const { findByTestId, queryByText } = renderMain();
  await findByTestId('adminRoot');
  expect(queryByText(trackingNote)).not.toBeInTheDocument();
});

test.each([
  ['/admin', {}],
  ['/admin/8eae8669-125c-42e5-8b49-89afbac31679', { teamId: '8eae8669-125c-42e5-8b49-89afbac31679' }],
  ['/admin/verseny/aqvco71pta--csomag-teljes', { competitionId: 'aqvco71pta--csomag-teljes' }],
  ['/admin/verseny/aqvco71pta--csomag-teljes/edit', { competitionId: 'aqvco71pta--csomag-teljes', edit: true }],
  ['/admin/feladat/10iqp4vy6b--csomag-kockak', { problemId: '10iqp4vy6b--csomag-kockak' }],
  ['/admin/verseny', {}],
  ['/admin/verseny/new', { newCompetition: true }],
])('the admin path %s opens %o', (pathname, opened) => {
  expect(adminPath(pathname)).toEqual(opened);
});

test('a problem\'s editor takes the competition it was opened from as a query parameter', () => {
  expect(adminPath('/admin/feladat/10iqp4vy6b--csomag-kockak', '?verseny=aqvco71pta--csomag-teljes'))
    .toEqual({ problemId: '10iqp4vy6b--csomag-kockak', competitionId: 'aqvco71pta--csomag-teljes' });
});
