import { useLogout, useRefreshTeamState, useTeamState, useToHome } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { RelayResultsTable } from './ResultTables';
import { relayMaxPoints, type RelayProblemDetails } from './relay-results';

/**
 * Component to display an end game screen with close button, and score
 * @param props selectRound: the close button leads back to the round selector
 * (by logging out) instead of reloading into the competition home page
 * @returns End screen
 */
export function RelayEndTable(props: { allPoints: number, problems: RelayProblemDetails[], selectRound?: boolean }) {
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  const logout = useLogout();
  const team = useTeamState();
  const { t } = useTranslation();
  // Named so the handlers below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    if (props.selectRound) {
      // Logging out leads back to the round selector, and it also clears
      // the saved match so the round can be replayed later
      await logout();
    } else {
      window.location.reload();
    }
  };

  return (
    <EndCard
      title={t('relay.endTable.title')}
      points={props.allPoints}
      max={relayMaxPoints(props.problems)}
      reminder={!props.selectRound && team?.strategyMatch.state === 'NOT STARTED' ? t('relay.endTable.reminder') : undefined}
      backLabel={props.selectRound ? t('relay.endTable.selectOtherRound') : t('relay.endTable.back')}
      onBack={() => void backToHome()}
    >
      <RelayResultsTable problems={props.problems} details transposeOnPhone/>
    </EndCard>
  );
}
