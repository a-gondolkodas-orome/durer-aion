// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ConnectionAlert } from './ConnectionAlert';

test('shows nothing while the socket has stayed up', () => {
  render(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('asks the team to check their last move once the socket is back, until they close it', () => {
  const { rerender } = render(<ConnectionAlert isConnected={false} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Megszakadt a kapcsolat');

  rerender(<ConnectionAlert isConnected={true} />);
  expect(screen.getByRole('alert')).toHaveTextContent('átment-e az utolsó lépésetek');

  fireEvent.click(screen.getByRole('button'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
