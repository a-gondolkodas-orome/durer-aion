// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ConnectionAlert } from './ConnectionAlert';

test('shows while the socket is down, and hides on reconnect', () => {
  const { rerender } = render(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  rerender(<ConnectionAlert isConnected={false} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Megszakadt a kapcsolat');

  rerender(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
