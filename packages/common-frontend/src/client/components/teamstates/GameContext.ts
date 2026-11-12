import { createContext, useContext } from "react";
import type { CompetitionCategory, PublicCompetition } from "schemas";

interface ClientProps {
  category: CompetitionCategory;
  /// The online round's: its boards are built from it.
  competition?: PublicCompetition | null;
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
