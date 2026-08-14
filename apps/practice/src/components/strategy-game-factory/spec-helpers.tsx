// Shared fixtures for the factory's own specs. Not a spec itself — the name
// keeps it out of vitest's `*.spec.*` glob.
//
// The engine's behaviour is tested by rendering a deliberately trivial game
// through the real factory, so every spec of it needs the same few pieces: a
// board that is just a list of strings, a one-move gameplay, and a BoardClient
// with a single button.
import { render, fireEvent } from '@testing-library/react';
import { Link, MemoryRouter, useLocation } from 'react-router';
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

// Naming no move is a bug in a strategy, so the engine throws for it in dev
// (see src/components/CLAUDE.md § Bot contract). A do-nothing default therefore
// left every vsComputer spec one stray scheduled beat away from failing on a
// strategy it never meant to test — which is exactly how #490 came about. The
// default plays instead: whatever gameplay the config carries, it names the
// first move the position allows. A spec that cares what the bot plays passes
// its own.
const playsFirstLegalMove = (gameplay: Gameplay<Board>): BotStrategy<Board> =>
  ({ board, ctx }) => {
    const name = Object.keys(gameplay.moves)
      .find(key => gameplay.moves[key]!.validate?.(board, { ctx }) ?? true);
    return name ? [{ move: name }] : [];
  };

export const makeConfig = ({
  BoardClient = MinimalBoardClient,
  gameplay = defaultGameplay,
  botStrategy = playsFirstLegalMove(gameplay),
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

export const ctxAwareConfig = (botStrategy?: BotStrategy<Board>) =>
  makeConfig({ BoardClient: CtxAwareBoardClient, botStrategy });

// The factory both reads and writes `?variant=`, so the harness shows the URL
// next to the game — the same shape language-context.spec.tsx uses. The links
// navigate within the same route, which is what a shared variant link does and
// the one case that remounts nothing.
const UrlProbe = () => <>
  <span data-testid="search">{useLocation().search}</span>
  <Link data-testid="go-to-gamma" to="/?variant=2">gamma</Link>
  <Link data-testid="go-to-no-variant" to="/">no variant</Link>
  <Link data-testid="go-to-nonsense" to="/?variant=nonsense">nonsense</Link>
</>;

export const renderGame = (config: StrategyGameConfig<Board>, entry = '/') => {
  const Game = strategyGameFactory(config);
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Game />
      <UrlProbe />
    </MemoryRouter>
  );
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
