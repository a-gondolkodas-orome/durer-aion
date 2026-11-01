// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ErrorBoundary } from './ErrorBoundary';

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
