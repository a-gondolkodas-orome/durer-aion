import React from 'react';
import { MockTeamState } from '../hooks/mock-user-hooks';
import { render } from '@testing-library/react';
import { Main } from './Main';

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

jest.mock('../hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

test('renders', () => {
  const { getByTestId } = render(<Main />);
  expect(getByTestId("mainRoot")).toBeInTheDocument();
});

test('main renders login if team is not logged in', () => {
  const { getByTestId } = render(<Main />);
  expect(getByTestId("loginRoot")).toBeInTheDocument();
});

test('main renders chooser if team is in HOME state', () => {
  MockTeamState.mockHome();
  const { getByTestId } = render(<Main />);
  expect(getByTestId("chooserRoot")).toBeInTheDocument();
});

test('main renders disclaimer if team is in DISCLAIMER state', () => {
  MockTeamState.mockDisclaimer();
  const { getByTestId } = render(<Main />);
  expect(getByTestId("disclaimerRoot")).toBeInTheDocument();
});

test('main renders Relay if team is in RELAY state', () => {
  MockTeamState.mockRelay();
  const { getByTestId } = render(<Main />);
  expect(getByTestId("relayRoot")).toBeInTheDocument();
});

test('main renders Strategy if team is in STRATEGY state', () => {
  MockTeamState.mockStrategy();
  const { getByTestId } = render(<Main />);
  expect(getByTestId("strategyRoot")).toBeInTheDocument();
});
