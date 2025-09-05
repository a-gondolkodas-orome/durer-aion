import { createContext, ReactNode, useContext } from "react";

type GameContextType = {
  RelayClient?: ReactNode,
  StrategyClient?: ReactNode,
}

const GameContext = createContext<GameContextType>({});

export const GameProvider = GameContext.Provider;

export const useGame = () => useContext(GameContext);