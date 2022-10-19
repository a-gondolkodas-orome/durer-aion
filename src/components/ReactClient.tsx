import { RelayClientWithBot_C, RelayClientWithBot_D, RelayClientWithBot_E, RelayClient_C, RelayClient_D, RelayClient_E } from '../games/relay/main';
import { ClientWithBot_C, ClientWithBot_D, ClientWithBot_E } from '../games/ten-coins/main';


const DURER_XVI_CLIENT_C_RELAY = RelayClientWithBot_C;
const DURER_XVI_CLIENT_D_RELAY = RelayClientWithBot_D;
const DURER_XVI_CLIENT_E_RELAY = RelayClientWithBot_E;
const DURER_XVI_CLIENT_C_STRATEGY = ClientWithBot_C;
const DURER_XVI_CLIENT_D_STRATEGY = ClientWithBot_D;
const DURER_XVI_CLIENT_E_STRATEGY = ClientWithBot_E;

export function DurerXVIRelayClient({ category, matchID, credentials }: {
  category: undefined | 'C' | 'D' | 'E', matchID: string,
  credentials: string
}) {
  return (
    <>
    {
      category === 'C' && (
        <DURER_XVI_CLIENT_C_RELAY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <DURER_XVI_CLIENT_D_RELAY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <DURER_XVI_CLIENT_E_RELAY {...{credentials, matchID}}/>
      )
    }
    </>
  );
}

export function DurerXVIStrategyClient({ category, matchID, credentials }: {
  category: undefined | 'C' | 'D' | 'E', matchID: string,
  credentials: string
}) {
  return (
    <>
    {
      category === 'C' && (
        <DURER_XVI_CLIENT_C_STRATEGY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <DURER_XVI_CLIENT_D_STRATEGY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <DURER_XVI_CLIENT_E_STRATEGY {...{credentials, matchID}}/>
      )
    }
    </>
  );
}
