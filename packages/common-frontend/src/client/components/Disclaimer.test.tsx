// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { StartWindow } from 'schemas';
import { Disclaimer } from './Disclaimer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'hu' } }),
  Trans: (props: { i18nKey: string }) => props.i18nKey,
}));
vi.mock('../client-repo-context', () => ({
  useClientRepo: () => ({ version: 'ONLINE' }),
}));
vi.mock('../hooks/user-hooks', () => ({
  useToHome: () => () => Promise.resolve(),
}));

const renderDisclaimer = (startWindow?: StartWindow | null) => render(
  <ThemeProvider theme={createTheme({ palette: { background: { paperOpacity: 1 } } })}>
    <Disclaimer teamName="Alpha" category="C" startWindow={startWindow}/>
  </ThemeProvider>);

afterEach(() => { vi.useRealTimers(); });

// The team reads on, rules included, before the window opens; it is told
// when the rounds start before it clicks through.
test('says when the rounds open, and still lets the team read on', () => {
  vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00Z') });
  renderDisclaimer({ opensAt: '2026-10-20T15:00:00+02:00' });

  expect(screen.getByTestId('startWindowNote')).toHaveTextContent('chooser.window.notOpenYet');
  expect(screen.getByRole('button', { name: 'disclaimer.continue' })).toBeEnabled();
});

test('says nothing without a window', () => {
  renderDisclaimer(null);

  expect(screen.queryByTestId('startWindowNote')).not.toBeInTheDocument();
});
