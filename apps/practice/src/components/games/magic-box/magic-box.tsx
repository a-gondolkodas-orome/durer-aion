import { range } from 'lodash';
import { strategyGameFactory, type Events, type BoardClientProps, type Ctx, GameBoard } from '../../game-factory';
import { generateEmptyBoard, isGameEnd, placeStone, type Board } from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (id) => {
    if (!ctx.isClientMoveAllowed) return false;
    return !board[id];
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    moves.placeStone(board, id);
  };

  return (
  <GameBoard>
    <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-600 gap-1 p-1">
      {range(9).map(id => (
        <button
          key={id}
          disabled={!isMoveAllowed(id)}
          onClick={() => clickField(id)}
          className="aspect-square p-[25%] bg-surface-elevated"
        >
          {board[id] && (
            <span className="w-full aspect-square block rounded-full bg-slate-800 dark:bg-slate-200"></span>
          )}
      </button>
      ))}
    </div>
  </GameBoard>
  );
};

const moves = {
  placeStone: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, id) => {
    const nextBoard = placeStone(board, id);
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame(ctx.currentPlayer === 0 ? 1 : 0);
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    A mágikus ládában kilenc rekesz van 3×3-as elrendezésben. Két játékos felváltva pakol köveket a
    láda rekeszeibe, minden rekeszbe legfeljebb egy kő rakható. Ha egy sorban vagy oszlopban
    mindhárom rekeszben van kő, a láda alja kiszakad. Az a játékos veszít, akinek a lépése után a
    láda kiszakad.
  </>,
  en: <>
    The magic box has nine compartments in a 3×3 grid. Two players alternately place stones into
    the compartments, at most one stone per compartment. If all three compartments of some row or
    column contain a stone, the bottom of the box breaks. The player whose move causes this loses.
  </>
};

export const MagicBox = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Helyezz le egy kavicsot egy üres rekeszbe kattintással.',
      en: 'Click on an empty compartment to place a stone.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal, second player always wins
      botStrategy: smartBotStrategy,
      generateStartBoard: generateEmptyBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
