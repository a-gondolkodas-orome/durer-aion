import { createContext, useContext } from "react";
import type { PublicCompetition, StartedStrategyGame } from "schemas";

interface ClientProps {
  /// The team's: its boards are built from it.
  competition?: PublicCompetition | null;
  /// The team's started strategy game, which the online round's board is built from.
  strategyGame?: StartedStrategyGame | null;
  teamName?: string;
  matchID?: string;
  credentials?: string;
};

interface GameContextType {
  RelayClient?: React.ComponentType<ClientProps>,
  StrategyClient?: React.ComponentType<ClientProps>,
}

const GameContext = createContext<GameContextType>({});

export const GameProvider = GameContext.Provider;

export const useGame = () => useContext(GameContext);
