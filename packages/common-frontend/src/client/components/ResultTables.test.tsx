// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RelayProgressTable, RelayResultsTable, StrategyGamesTable } from './ResultTables';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test("a relay's table shows each problem's points out of its max, and a dash for a time never spent", () => {
  render(<RelayResultsTable details problems={[
    { maxPoints: 3, points: 2, tries: 2, trySeconds: [180, 90] },
    { maxPoints: 6, points: 0, tries: 0 },
  ]}/>);

  expect(screen.getByText('2', { selector: 'b' }).parentElement).toHaveTextContent('2/3');
  expect(screen.getByText('0/6')).toBeInTheDocument();
  expect(screen.getByText('4:30')).toBeInTheDocument();
  expect(screen.getByText('–')).toBeInTheDocument();
});

test("a long problem set continues in a second row of the same width", () => {
  const problems = Array.from({ length: 12 }, () => ({ maxPoints: 3, points: 3, tries: 1 }));
  render(<RelayResultsTable problems={problems}/>);

  expect(screen.getAllByText('relay.endTable.task')).toHaveLength(2);
  expect(screen.getByText('12.')).toBeInTheDocument();
});

test("the live progress shows only what is decided, and what the rest is worth", () => {
  render(<RelayProgressTable current={1} problems={[
    { maxPoints: 3, points: 2, tries: 2 },
    { maxPoints: 4, points: 0, tries: 0 },
    { maxPoints: 5, points: 0, tries: 0 },
  ]}/>);

  expect(screen.getByText('2/3')).toBeInTheDocument();
  expect(screen.getByText('–/4')).toBeInTheDocument();
  expect(screen.getByText('–/5')).toBeInTheDocument();
});

test("each live game is named by its result for a screen reader", () => {
  render(<StrategyGamesTable results={['lost', 'won', 'won']}/>);

  expect(screen.getAllByRole('img', { name: 'strategy.endTable.won' })).toHaveLength(2);
  expect(screen.getAllByRole('img', { name: 'strategy.endTable.lost' })).toHaveLength(1);
});
