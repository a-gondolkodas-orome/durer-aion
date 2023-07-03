import { InProgressMatchStatus, TeamModelDto } from '../../dto/TeamStateDto';
import { FinishedRelay } from './FinishedRelay';
import { DurerXVIRelayClient } from '../../../components/ReactClient';

export function Relay(props: {state: TeamModelDto}) {
  switch (props.state.relayMatch.state) {
    case "FINISHED":
      return (
        <FinishedRelay state={props.state}/>
      )
    case "IN PROGRESS":
      return (
        <DurerXVIRelayClient
          category={props.state.category as 'C' | 'D' | 'E'}
          credentials={props.state.credentials}
          matchID={(props.state.relayMatch as InProgressMatchStatus).matchID}
        />
      )
    case "NOT STARTED":
    default: return <>ROSSZ KATEGÓRIA</>;
  }
}