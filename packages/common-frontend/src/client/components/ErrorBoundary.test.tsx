// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../common/i18n';
import { ErrorBoundary } from './ErrorBoundary';

test('shows the error message and a way back instead of a crashed child', () => {
  // React logs the caught error, and the boundary reports it to `window`.
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
  // jsdom has no `reportError`.
  const reportError = vi.fn();
  vi.stubGlobal('reportError', reportError);
  let crash = true;
  const Child = () => {
    if (crash) throw new Error('boom');
    return <div>recovered</div>;
  };
  const onReset = vi.fn();
  const { getByText, getByRole } = render(
    <ErrorBoundary onReset={onReset}><Child /></ErrorBoundary>
  );
  expect(getByText('Váratlan hiba történt')).toBeInTheDocument();
  expect(reportError).toHaveBeenCalled();

  crash = false;
  fireEvent.click(getByRole('button', { name: 'Vissza a kezdőlapra' }));
  expect(onReset).toHaveBeenCalled();
  expect(getByText('recovered')).toBeInTheDocument();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
