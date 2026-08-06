// Shared fixtures for the factory's own specs. Not a spec itself — the name
// keeps it out of vitest's `*.spec.*` glob.
//
// The engine's behaviour is tested by rendering a deliberately trivial game
// through the real factory, so every spec of it needs the same few pieces: a
// board that is just a list of strings, a one-move gameplay, and a BoardClient
// with a single button.
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory, type StrategyGameConfig } from './strategy-game-factory';
import type { BoardClientProps, BotStrategy, Gameplay, VariantInput } from './types';

export type Board = string[];

export const MinimalBoardClient = ({ board, moves }: BoardClientProps<Board>) => (
  <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>move</button>
);

export const CtxAwareBoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => (
  <button
    data-testid="move-btn"
    disabled={!ctx.isClientMoveAllowed}
    onClick={() => moves.mainMove(board)}
  >move</button>
);

export const defaultGameplay: Gameplay<Board> = {
  moves: {
    mainMove: {
      apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
    }
  }
};

export const makeConfig = ({
  BoardClient = MinimalBoardClient,
  gameplay = defaultGameplay,
  botStrategy = (() => []) as BotStrategy<Board>,
  variants
}: {
  BoardClient?: StrategyGameConfig<Board>['BoardClient']
  gameplay?: Gameplay<Board>
  botStrategy?: BotStrategy<Board>
  variants?: VariantInput<Board>[]
} = {}): StrategyGameConfig<Board> => ({
  presentation: { rule: <></>, getPlayerStepDescription: () => '' },
  BoardClient,
  gameplay,
  variants: variants ?? [{ botStrategy, generateStartBoard: (): Board => ['initial'] }]
});

export const minimalConfig = (gameplay: Gameplay<Board>) => makeConfig({ gameplay });

export const ctxAwareConfig = (botStrategy: BotStrategy<Board> = () => []) =>
  makeConfig({ BoardClient: CtxAwareBoardClient, botStrategy });

export const renderGame = (config: StrategyGameConfig<Board>) => {
  const Game = strategyGameFactory(config);
  return render(<MemoryRouter><Game /></MemoryRouter>);
};

// Headless UI's PlayerNameSetup is slow on its very first render, enough to
// push whichever test happens to open it first over a timeout. Paying that
// cost once up front in a beforeAll keeps it out of the timings. Call it from
// any spec file that switches to vsHuman mode.
export const warmUpPlayerNameSetup = () => {
  const { getByTestId, unmount } = renderGame(ctxAwareConfig());
  fireEvent.click(getByTestId('mode-vsHuman'));
  unmount();
};
