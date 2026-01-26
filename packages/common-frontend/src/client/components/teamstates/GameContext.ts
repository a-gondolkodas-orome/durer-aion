import { createContext, ReactNode, useContext } from "react";

interface ClientProps {
  category?: 'C' | 'D' | 'E';
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