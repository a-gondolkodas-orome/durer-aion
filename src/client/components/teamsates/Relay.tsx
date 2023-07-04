import { TeamModelDto } from '../../dto/TeamStateDto';
import { useTeamState } from '../../hooks/user-hooks';
import { RelayClientWithBot_C, RelayClientWithBot_D, RelayClientWithBot_E } from '../../../games/relay/main';

export function Relay(props: { state: TeamModelDto }) {
  const team = useTeamState();
  switch (team?.category) {
    case "C":
      return (
        <RelayClientWithBot_C />
      )
    case "D":
      return (
        <RelayClientWithBot_D />
      )
    case "E":
      return (
        <RelayClientWithBot_E />
      )
    default: return <>ROSSZ KATEGÓRIA</>;
  }
}