import { range, sum, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import type { Ctx, Events, BoardClientProps } from '../../game-factory/types';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useTranslation } from '../../language/translate';
import { GameBoard } from '../../game-factory/game-parts/game-board';

export type Board = number[]
type TurnState = { firstPlacedSquareIndex: number } | null

const generateStartBoard = (): Board => {
  const board = Array(5).fill(0);
  const x = random(4);
  board[x] += 1;
  return board;
};

const moves = {
  addPiece: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, pileId: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] += 1;
    if (ctx.currentPlayer === 1 && [3, 6, 9].includes(sum(nextBoard))) {
      events.setTurnState({ firstPlacedSquareIndex: pileId });
      return { nextBoard };
    }
    events.setTurnState(null);
    events.endTurn();
    if (sum(nextBoard) === 10) {
      const winnerIndex = isEqual(cloneDeep(nextBoard).sort(), [0, 1, 2, 3, 4]) ? 1 : 0;
      events.endGame(winnerIndex);
    }
    return { nextBoard };
  },
  undoFirstDisc: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }) => {
    const nextBoard = cloneDeep(board);
    nextBoard[(ctx.turnState as TurnState)!.firstPlacedSquareIndex] -= 1;
    events.setTurnState(null);
    return { nextBoard };
  }
}

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();

  const placePiece = (id: number) => {
    if (!ctx.isClientMoveAllowed) return;
    moves.addPiece(board, id);
  };

  const turnState = ctx.turnState as TurnState;
  const firstPlacedSquareIndex = turnState?.firstPlacedSquareIndex ?? null;
  const showDimmedDisc = ctx.isClientMoveAllowed && firstPlacedSquareIndex !== null;

  return (
  <GameBoard>
    <div className="grid grid-cols-3 gap-0 border-t-4 border-l-4">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => placePiece(id)}
          className="aspect-square border-r-4 border-b-4 p-[3%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[2%] aspect-square inline-block bg-blue-600 rounded-full
                ${board[id] <= 4 ? 'w-[37%]' : (board[id] <= 6 ? 'w-[28%]': 'w-[20%]')}
                ${showDimmedDisc && id === firstPlacedSquareIndex && i === board[id] - 1 ? 'opacity-40' : ''}
              `}
            >
            </span>
          )}
      </button>
      )}
    </div>
    {ctx.isClientMoveAllowed && firstPlacedSquareIndex !== null && (
      <div className="flex justify-end mt-2">
        <button
          className="cta-button w-auto bg-slate-400 enabled:hover:bg-slate-500 text-sm"
          onClick={() => moves.undoFirstDisc(board)}
        >
          {t({ hu: '↶ Visszavonás', en: '↶ Undo' })}
        </button>
      </div>
    )}
  </GameBoard>
  );
};

const getPlayerStepDescription = ({ ctx }) => {
  if (ctx.currentPlayer === 1 && ctx.turnState === null) {
    return {
      hu: 'Kattints arra a mezőre, ahova az első korongot szeretnéd rakni. (1/2)',
      en: 'Click the square where you want to place the first piece. (1/2)'
    };
  }
  if (ctx.currentPlayer === 1 && ctx.turnState !== null) {
    return {
      hu: 'Kattints arra a mezőre, ahova a második korongot szeretnéd rakni. (2/2)',
      en: 'Click the square where you want to place the second piece. (2/2)'
    };
  }
  return {
    hu: 'Kattints arra a mezőre, ahova korongot szeretnél lerakni. (1/1)',
    en: 'Click the square where you want to place a piece. (1/1)'
  };
};

const rule = {
  hu: <>
    A játék során egy öt mezőből álló táblára helyezünk korongokat. Kezdetben egy korong van a táblán.
    Ezután minden körben a kezdőjátékos egy korongot helyez a táblára, majd ezután a második játékos tesz le két
    korongot. (A két korongot lehet azonos, illetve különböző mezőkre is tenni.) A játék 3 kör után ér véget,
    amikor a 10. korong felkerül a táblára. A második játékos akkor nyer, ha a játék végén
    minden mezőn különböző számú korong áll.
  </>,
  en: <>
    Players place pieces on a board of five squares. One piece is on the board at the start.
    Each round the first player places one piece, then the second player places two pieces (both
    may go on the same or different squares). The game ends after 3 rounds when the 10th piece is
    placed. The second player wins if every square has a different number of pieces at the end.
  </>
};

export const FiveSquares = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
