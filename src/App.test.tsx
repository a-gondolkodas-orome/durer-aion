import React from 'react';
import { MockTeamState } from './client/hooks/mock-user-hooks';
import { render, screen } from '@testing-library/react';
import App from './App';
import { dictionary } from './client/text-constants';

jest.mock('./client/hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

test('renders', () => {
  render(<App />);
  const linkElement = screen.getByText(new RegExp(dictionary.login.beforeTitle + " " + dictionary.header.title));
  expect(linkElement).toBeInTheDocument();
});
