// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ErrorBoundary } from './ErrorBoundary';
import { setUsageReporter } from '../utils/usage-report';

test('shows the error message and a way back instead of a crashed child', () => {
  // React logs the caught error.
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
  const Child = () => {
    throw new Error('boom');
  };
  const { getByText, getByRole } = render(
    <ErrorBoundary><Child /></ErrorBoundary>
  );
  expect(getByText('Váratlan hiba történt')).toBeInTheDocument();
  expect(getByRole('button', { name: 'Vissza a kezdőlapra' })).toBeInTheDocument();
  vi.restoreAllMocks();
});

test('clears the error when a reset key changes', () => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
  const Child = ({ crash }: { crash: boolean }) => {
    if (crash) throw new Error('boom');
    return <div>login</div>;
  };
  const { getByText, rerender } = render(
    <ErrorBoundary resetKeys={['RELAY']}><Child crash /></ErrorBoundary>
  );
  expect(getByText('Váratlan hiba történt')).toBeInTheDocument();
  rerender(<ErrorBoundary resetKeys={[undefined]}><Child crash={false} /></ErrorBoundary>);
  expect(getByText('login')).toBeInTheDocument();
  vi.restoreAllMocks();
});

test('reports the crash with its error, once', () => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
  const report = vi.fn();
  setUsageReporter(report);
  const Child = () => {
    throw new TypeError('boom');
  };
  render(<ErrorBoundary><Child /></ErrorBoundary>);
  expect(report.mock.calls).toStrictEqual([['crash', { error: 'TypeError', message: 'boom' }]]);
  setUsageReporter(() => undefined);
  vi.restoreAllMocks();
});
