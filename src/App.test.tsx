import React from 'react';
import { MockTeamState } from './client/hooks/mock-user-hooks';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./client/hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

test('renders', () => {
  render(<App />);
  const linkElement = screen.getByText(/Üdvözlünk a XVII. Dürer/);
  expect(linkElement).toBeInTheDocument();
});
