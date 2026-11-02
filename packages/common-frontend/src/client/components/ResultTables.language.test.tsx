// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from '../../common/i18n';
import { RelayResultsTable, StrategyGamesTable } from './ResultTables';

// Unmounted first: switching the language back re-renders whatever is mounted.
afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('hu');
});

// The admin dialog's text is Hungarian only, and its tables followed the
// page's language switcher into English.
test('a table held to Hungarian stays Hungarian on an English page', async () => {
  await i18n.changeLanguage('en');
  render(<>
    <RelayResultsTable problems={[{ maxPoints: 3, points: 3, trySeconds: [60] }]} lng="hu"/>
    <StrategyGamesTable results={['won']} lng="hu"/>
  </>);

  expect(screen.getByText('Feladat')).toBeInTheDocument();
  expect(screen.getByText('Éles játszma')).toBeInTheDocument();
  expect(screen.queryByText('Task')).not.toBeInTheDocument();
});

test('a table not held to a language follows the page', async () => {
  await i18n.changeLanguage('en');
  render(<RelayResultsTable problems={[{ maxPoints: 3, points: 3, trySeconds: [60] }]}/>);

  expect(screen.getByText('Task')).toBeInTheDocument();
});
