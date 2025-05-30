import React from 'react';
import { MockTeamState } from '../hooks/mock-user-hooks';
import { render, screen } from '@testing-library/react';
import { Main } from './Main';

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

jest.mock('../hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

test('renders', () => {
  render(<Main />);
  const linkElement = screen.getByTestId("mainRoot");
  expect(linkElement).toBeInTheDocument();
});

test('main renders login if team is not logged in', () => {
  render(<Main />);
  const linkElement = screen.getByTestId("loginRoot");
  expect(linkElement).toBeInTheDocument();
});

test('main renders chooser if team is in HOME state', () => {
  MockTeamState.mockHome()
  render(<Main />);
  const linkElement = screen.getByTestId("chooserRoot");
  expect(linkElement).toBeInTheDocument();
});

test('main renders disclaimer if team is in DISCLAIMER state', () => {
  MockTeamState.mockDisclaimer()
  render(<Main />);
  const linkElement = screen.getByTestId("disclaimerRoot");
  expect(linkElement).toBeInTheDocument();
});

test('main renders Relay if team is in RELAY state', () => {
  MockTeamState.mockRelay()
  render(<Main />);
  const linkElement = screen.getByTestId("relayRoot");
  expect(linkElement).toBeInTheDocument();
});

test('main renders Strategy if team is in STRATEGY state', () => {
  MockTeamState.mockStrategy()
  render(<Main />);
  const linkElement = screen.getByTestId("strategyRoot");
  expect(linkElement).toBeInTheDocument();
});
