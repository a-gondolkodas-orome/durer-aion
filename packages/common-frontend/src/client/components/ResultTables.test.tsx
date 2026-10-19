// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { LiveGameResult } from 'schemas';
import { RelayProgressTable, RelayResultsTable, StrategyGamesTable } from './ResultTables';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test("a relay's table shows each problem's points out of its max, and a dash for a time never spent", () => {
  render(<RelayResultsTable details problems={[
    { maxPoints: 3, points: 2, trySeconds: [180, 90] },
    { maxPoints: 6, points: 0, trySeconds: [] },
  ]}/>);

  expect(screen.getByText('2', { selector: 'b' }).parentElement).toHaveTextContent('2/3');
  expect(screen.getByText('0/6')).toBeInTheDocument();
  expect(screen.getByText('4:30')).toBeInTheDocument();
  expect(screen.getByText('–')).toBeInTheDocument();
});

test("a long problem set continues in a second row", () => {
  const problems = Array.from({ length: 15 }, () => ({ maxPoints: 3, points: 3, trySeconds: [60] }));
  render(<RelayResultsTable problems={problems}/>);

  expect(screen.getAllByText('relay.endTable.task')).toHaveLength(2);
  expect(screen.getByText('15.')).toBeInTheDocument();
});

test("a long run of live games shows only the latest ones, numbered as played", () => {
  render(<StrategyGamesTable results={Array.from({ length: 15 }, (): LiveGameResult => 'lost')}/>);

  expect(screen.getAllByText('strategy.endTable.game')).toHaveLength(1);
  expect(screen.getByText('10.')).toBeInTheDocument();
  expect(screen.getByText('15.')).toBeInTheDocument();
  expect(screen.queryByText('9.')).not.toBeInTheDocument();
});

test("the live progress shows only what is decided, and what the rest is worth", () => {
  render(<RelayProgressTable current={1} problems={[
    { maxPoints: 3, points: 2, trySeconds: [60, 60] },
    { maxPoints: 4, points: 0, trySeconds: [] },
    { maxPoints: 5, points: 0, trySeconds: [] },
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

test("a running relay shows its current problem and the ones after it as not ended, though they have no points", () => {
  render(<RelayResultsTable current={1} problems={[
    { maxPoints: 3, points: 3, trySeconds: [60] },
    { maxPoints: 4, points: 0, trySeconds: [60] },
    { maxPoints: 5, points: 0, trySeconds: [] },
  ]}/>);

  expect(screen.getByText('–/4')).toBeInTheDocument();
  expect(screen.getByText('–/5')).toBeInTheDocument();
  expect(screen.queryByText('0/5')).not.toBeInTheDocument();
});

test("a last try worth nothing is not called wrong, since a right answer would score 0 too", () => {
  render(<RelayResultsTable details problems={[
    { maxPoints: 2, points: 0, trySeconds: [60, 60, 60] },
    { maxPoints: 3, points: 0, trySeconds: [60, 60, 60] },
  ]}/>);

  expect(screen.getByLabelText('relay.endTable.pointsOf: relay.endTable.tries')).toBeInTheDocument();
  expect(screen.getByLabelText('relay.endTable.pointsOf: relay.endTable.wrongTries')).toBeInTheDocument();
});
