import { TeamModelDto } from '../../dto/TeamStateDto';
import { useTeamState } from '../../hooks/user-hooks';
import { Client_C as TenCoinsClient_C, ClientWithBot_C as TenCoinsWithBotClient_C} from '../../../games/ten-coins/main';
import { Client_D as TenCoinsClient_D, ClientWithBot_D as TenCoinsWithBotClient_D} from '../../../games/ten-coins/main';
import { Client_E as TenCoinsClient_E, ClientWithBot_E as TenCoinsWithBotClient_E} from '../../../games/ten-coins/main';

export function Strategy(props: {state: TeamModelDto}) {
  const team = useTeamState();
  switch (team?.category) {
    case "C":
      return (
        <TenCoinsWithBotClient_C />
      )
    case "D":
      return (
        <TenCoinsWithBotClient_D />
      )
    case "E":
      return (
        <TenCoinsWithBotClient_E />
      )
    default: return <>ROSSZ KATEGÓRIA</>;
  }
}