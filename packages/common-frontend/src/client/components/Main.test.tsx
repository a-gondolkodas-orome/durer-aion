// @vitest-environment jsdom
import React from 'react';
import { afterEach, test, expect, vi } from 'vitest';
import { MockTeamState } from '../hooks/mock-user-hooks';
import { render } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
// `Main` calls `i18next.changeLanguage` while rendering, so i18next has to be
// initialised the same way the apps initialise it: by importing this module.
import '../../common/i18n';
import { ClientRepoProvider, MockClientRepository } from '../api-repository-interface';
import { ThemeProvider } from '@mui/material/styles';
import { Main } from './Main';

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
});

// `Layout` merges its own theme into the surrounding one, so `Main` needs an
// outer theme to merge with — the apps pass their accent colour here.
const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

// `Header` reads the client repository off context, so `Main` cannot render
// outside a provider — same as in the apps.
const renderMain = () =>
  render(
    <ThemeProvider theme={outerTheme}>
      <ClientRepoProvider value={new MockClientRepository()}>
        <Main language="hu" gitCommitHash="test" />
      </ClientRepoProvider>
    </ThemeProvider>
  );

test('renders', () => {
  const { getByTestId } = renderMain();
  expect(getByTestId("mainRoot")).toBeInTheDocument();
});

test('main renders login if team is not logged in', () => {
  const { getByTestId } = renderMain();
  expect(getByTestId("loginRoot")).toBeInTheDocument();
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
test('the admin page is the whole page, not a panel above the login form', () => {
  MockTeamState.mockLoggedOut();
  window.history.replaceState({}, '', '/admin');

  const { getByTestId, queryByTestId } = renderMain();

  expect(getByTestId('adminRoot')).toBeInTheDocument();
  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();
});

// The worse half: an organiser who tested a team account still holds its
// session, and the team's board is live and playable when it renders.
test('an organiser still holding a team session is not handed that team\'s board', () => {
  MockTeamState.mockRelay();
  window.history.replaceState({}, '', '/admin/8eae8669-125c-42e5-8b49-89afbac31679');

  const { getByTestId, queryByTestId } = renderMain();

  expect(getByTestId('adminRoot')).toBeInTheDocument();
  expect(queryByTestId('relayRoot')).not.toBeInTheDocument();
});

test('a team away from /admin still gets its own page', () => {
  MockTeamState.mockRelay();

  const { getByTestId, queryByTestId } = renderMain();

  expect(getByTestId('relayRoot')).toBeInTheDocument();
  expect(queryByTestId('adminRoot')).not.toBeInTheDocument();
});
