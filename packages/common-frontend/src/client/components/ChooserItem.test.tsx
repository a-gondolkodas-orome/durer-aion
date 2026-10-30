// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { ChooserItem } from './ChooserItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

const startRelay = vi.fn<() => Promise<void>>();
vi.mock('../hooks/user-hooks', () => ({
  useStartRelay: () => startRelay,
  useStartStrategy: () => () => Promise.resolve(),
}));

// Regression: a double click sent two starts.
test('sends one start for a double click, and enables Start again once it answered', async () => {
  let answer: () => void = () => undefined;
  startRelay.mockImplementation(() => new Promise<void>(resolve => { answer = resolve; }));
  render(<ChooserItem type="relay" status={{ state: 'NOT STARTED' }} hideDesc />);
  const start = screen.getByRole('button', { name: 'chooser.start' });

  fireEvent.click(start);
  fireEvent.click(start);

  expect(startRelay).toHaveBeenCalledTimes(1);
  expect(start).toBeDisabled();
  await act(async () => answer());
  expect(start).toBeEnabled();
});
