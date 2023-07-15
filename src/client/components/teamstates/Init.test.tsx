import React from 'react';
import { MockTeamState, mockTeamState } from '../../hooks/mock-user-hooks';
import { render, screen } from '@testing-library/react';
import { Init } from './Init';

jest.mock('../../hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

test('renders', () => {
  render(<Init state={mockTeamState} />);
  const linkElement = screen.getByTestId("initRoot");
  expect(linkElement).toBeInTheDocument();
});
