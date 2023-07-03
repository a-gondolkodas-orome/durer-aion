import { InProgressMatchStatus, TeamModelDto } from '../../dto/TeamStateDto';
import { FinisheStrategy } from './FinishedStrategy';
import { DurerXVIStrategyClient } from '../../../components/ReactClient';

export function Strategy(props: {state: TeamModelDto}) {
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
      return (
        <FinisheStrategy state={props.state}/>
      )
    case "IN PROGRESS":
      console.log(props.state.category as 'C' | 'D' | 'E')
      console.log(props.state.credentials)
      console.log((props.state.strategyMatch as InProgressMatchStatus).matchID)
      return (
        <DurerXVIStrategyClient 
          category={props.state.category as 'C' | 'D' | 'E'}
          credentials={props.state.credentials}
          matchID={(props.state.strategyMatch as InProgressMatchStatus).matchID}
        />
      )
    case "NOT STARTED":
    default: return <>NEM TÁMOGATOTT JÁTÉKÁLLAPOT</>;
  }
}