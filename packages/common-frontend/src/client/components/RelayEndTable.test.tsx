// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
// The component renders translated labels, so i18next has to be initialised
// the same way the apps initialise it: by importing this module.
import '../../common/i18n';
import { MockTeamState } from '../hooks/mock-user-hooks';
import { RelayEndTable, RelayEndTableData } from './RelayEndTable';

vi.mock('../hooks/user-hooks', () => {
  return MockTeamState.mockHook;
});

// Regression test for #383: the end table rendered <tr>s directly under
// <table> and mapped lists without keys, so React logged an error for every
// row in dev. Any console error while rendering fails these tests.
let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error');
});
afterEach(() => {
  consoleError.mockRestore();
});

const tasks = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ max: 3, got: i % 4 === 0 ? null : i % 4 }));

test('renders without console errors', () => {
  const { getByText } = render(<RelayEndTable allPoints={12} task={tasks(10)} />);
  expect(getByText('1.')).toBeInTheDocument();
  expect(consoleError).not.toHaveBeenCalled();
});

test('renders a long task list in chunks without console errors', () => {
  const { getByText } = render(<RelayEndTable allPoints={12} task={tasks(15)} />);
  expect(getByText('15.')).toBeInTheDocument();
  expect(consoleError).not.toHaveBeenCalled();
});

test('RelayEndTableData renders without console errors', () => {
  const withAnswers = tasks(15).map((task, i) => ({ ...task, answers: [i, i + 1] }));
  const { getByText } = render(<RelayEndTableData allPoints={12} task={withAnswers} />);
  expect(getByText('15.')).toBeInTheDocument();
  expect(consoleError).not.toHaveBeenCalled();
});
