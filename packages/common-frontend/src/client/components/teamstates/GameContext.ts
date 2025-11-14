import { createContext, ReactNode, useContext } from "react";

type GameContextType = {
  RelayClient?: React.ComponentType<any>,
  StrategyClient?: React.ComponentType<any>,
}

const GameContext = createContext<GameContextType>({});

export const GameProvider = GameContext.Provider;

export const useGame = () => useContext(GameContext);