import { useBackToHome, useLogout, useTeamState } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { RelayResultsTable } from './ResultTables';
import { relayMaxPoints, type RelayProblemDetails } from './relay-results';

/**
 * The relay's end screen. With `selectRound`, the button logs out to the round
 * selector, which also clears the saved match so the round can be replayed.
 */
export function RelayEndTable(props: { allPoints: number, problems: RelayProblemDetails[], selectRound?: boolean }) {
  const logout = useLogout();
  const backToHome = useBackToHome(props.selectRound ? logout : undefined);
  const team = useTeamState();
  const { t } = useTranslation();

  return (
    <EndCard
      title={t('relay.endTable.title')}
      points={props.allPoints}
      max={relayMaxPoints(props.problems)}
      reminder={!props.selectRound && team?.strategyMatch.state === 'NOT STARTED' ? t('relay.endTable.reminder') : undefined}
      backLabel={props.selectRound ? t('relay.endTable.selectOtherRound') : t('general.backHome')}
      onBack={backToHome}
    >
      <RelayResultsTable problems={props.problems} details transposeOnPhone/>
    </EndCard>
  );
}
