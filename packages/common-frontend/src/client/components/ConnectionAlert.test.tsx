// @vitest-environment jsdom
import { afterEach, test, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ConnectionAlert } from './ConnectionAlert';

afterEach(() => { vi.restoreAllMocks(); });

test('shows while the socket is down', () => {
  const { rerender } = render(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  rerender(<ConnectionAlert isConnected={false} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Megszakadt a kapcsolat');

  rerender(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('shows while the browser is offline, even before the socket notices', () => {
  const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  render(<ConnectionAlert isConnected={true} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  onLine.mockReturnValue(false);
  act(() => { window.dispatchEvent(new Event('offline')); });
  expect(screen.getByRole('alert')).toBeInTheDocument();

  onLine.mockReturnValue(true);
  act(() => { window.dispatchEvent(new Event('online')); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
