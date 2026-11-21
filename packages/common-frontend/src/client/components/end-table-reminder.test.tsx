// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import type { PublicCompetition } from 'schemas';
import { mockTeamState } from '../hooks/mock-user-hooks';
import type { TeamModelDto } from '../dto/TeamStateDto';
import { RelayEndTable } from './RelayEndTable';
import { StrategyEndTable } from './StrategyEndTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'hu' } }),
}));
let team: TeamModelDto | null = null;
vi.mock('../hooks/user-hooks', () => ({
  useTeamState: () => team,
  useBackToHome: () => () => undefined,
  useLogout: () => () => undefined,
}));

const both: PublicCompetition = {
  id: 'aaaaaaaaaa--both',
  languages: ['hu'],
  relay: { durationMinutes: 30, problemPoints: [3] },
  strategy: { durationMinutes: 20 },
  metadata: { kind: 'other', label: { hu: 'Mindkettő' } },
};
const relayOnly: PublicCompetition = { ...both, strategy: undefined };
const strategyOnly: PublicCompetition = { ...both, relay: undefined };

const inCompetition = (competition: PublicCompetition) => { team = { ...mockTeamState, competition }; };

// Regression: a competition without the other match was told to play it.
describe('the end tables\' reminder of the other match', () => {
  test.each([
    ['reminds a team whose competition has a relay too', both, true],
    ['says nothing in a strategy-only competition', strategyOnly, false],
  ])('after the strategy game, %s', (_, competition, reminds) => {
    inCompetition(competition);
    render(<StrategyEndTable allPoints={0} liveResults={[]}/>);
    expect(screen.queryByText('strategy.endTable.reminder') !== null).toBe(reminds);
  });

  test.each([
    ['reminds a team whose competition has a strategy game too', both, true],
    ['says nothing in a relay-only competition', relayOnly, false],
  ])('after the relay, %s', (_, competition, reminds) => {
    inCompetition(competition);
    render(<RelayEndTable allPoints={0} problems={[]}/>);
    expect(screen.queryByText('relay.endTable.reminder') !== null).toBe(reminds);
  });

  test('says nothing once the other match has started', () => {
    team = { ...mockTeamState, competition: both, relayMatch: { state: 'IN PROGRESS', matchID: 'm', startAt: new Date(), endAt: new Date() } };
    render(<StrategyEndTable allPoints={0} liveResults={[]}/>);
    expect(screen.queryByText('strategy.endTable.reminder')).not.toBeInTheDocument();
  });
});
