import { OnlineClient as TicTacToeOnlineClient } from '../games/tictactoe/main';

const DURER_XVI_CLIENT_C_RELAY = TicTacToeOnlineClient;
const DURER_XVI_CLIENT_D_RELAY = TicTacToeOnlineClient;
const DURER_XVI_CLIENT_E_RELAY = TicTacToeOnlineClient;
const DURER_XVI_CLIENT_C_STRATEGY = TicTacToeOnlineClient;
const DURER_XVI_CLIENT_D_STRATEGY = TicTacToeOnlineClient;
const DURER_XVI_CLIENT_E_STRATEGY = TicTacToeOnlineClient;

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
