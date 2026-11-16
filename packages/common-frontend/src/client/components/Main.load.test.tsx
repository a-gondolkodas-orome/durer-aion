// @vitest-environment jsdom
import React from 'react';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import i18next from 'i18next';
import { ThemeProvider } from '@mui/material/styles';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { forgetTeamState } from '../hooks/team-state-store';
import { mockTeamState } from '../hooks/mock-user-hooks';
import type { TeamModelDto } from '../dto/TeamStateDto';
import { Main } from './Main';

// Main.test.tsx mocks the hooks away; what is under test here is the page
// load itself, from the real `LoadTeamState` through the real store (#777).

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

let repo: MockClientRepository;

// `team/me` on a slow network: answered only when the test says so.
const delayTeamState = () => {
  let answer!: (team: TeamModelDto | null) => void;
  let fail!: (error: Error) => void;
  vi.spyOn(repo, 'getTeamState').mockReturnValue(new Promise((resolve, reject) => {
    answer = resolve;
    fail = reject;
  }));
  return {
    answer: (team: TeamModelDto | null) => act(async () => answer(team)),
    fail: (error: Error) => act(async () => fail(error)),
  };
};

const renderMain = () => render(
  <ThemeProvider theme={outerTheme}>
    <ClientRepoProvider value={repo}><Main gitCommitHash="test"/></ClientRepoProvider>
  </ThemeProvider>
);

beforeEach(() => {
  repo = new MockClientRepository();
  // Module state: every test is a fresh page load.
  act(() => forgetTeamState());
});

test('a logged-in team reloading the page never sees the login form', async () => {
  const teamMe = delayTeamState();
  const { queryByTestId, findByTestId } = renderMain();

  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();

  await teamMe.answer({ ...mockTeamState, pageState: 'HOME' });

  expect(await findByTestId('chooserRoot')).toBeInTheDocument();
  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();
});

test('a logged-out visitor gets the login form once team/me answers', async () => {
  const teamMe = delayTeamState();
  const { queryByTestId } = renderMain();
  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();

  await teamMe.answer(null);

  expect(queryByTestId('loginRoot')).toBeInTheDocument();
});

test('a failed team/me shows an error, not the login form', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const teamMe = delayTeamState();
  const { queryByTestId, findByText } = renderMain();

  await teamMe.fail(new Error('offline'));

  expect(await findByText(i18next.t('error.unexpected'))).toBeInTheDocument();
  expect(queryByTestId('loginRoot')).not.toBeInTheDocument();
  expect(consoleError).toHaveBeenCalled();
});
