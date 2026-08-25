// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi } from 'vitest';
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
