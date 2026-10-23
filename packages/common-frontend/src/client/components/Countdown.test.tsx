// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '../../common/i18n';
import { Countdown } from './Countdown';

afterEach(() => {
  cleanup();
});

function renderAt(msRemaining: number) {
  render(<Countdown
    msRemaining={msRemaining}
    setMsRemaining={vi.fn()}
    getServerTimer={vi.fn()}
    endTime={new Date(Date.now() + msRemaining)}
    serverRemainingMs={msRemaining} />);
}

test('shows the time left', () => {
  renderAt(65 * 1000);

  expect(screen.getByText('00:01:05')).toBeDefined();
});

// Regression: from 5 to 10 s past the end the time was formatted as a negative
// number, "-1:-1:-7", which the relay board shows while the game still judges a
// late answer.
test.each([0, -1000, -7000, -9999])('shows zero at %i ms, inside the grace for late answers', (msRemaining) => {
  renderAt(msRemaining);

  expect(screen.getByText('00:00:00')).toBeDefined();
});

test('shows that the time is over once the grace is', () => {
  renderAt(-10000);

  expect(screen.getByText('XX:XX:XX')).toBeDefined();
});
