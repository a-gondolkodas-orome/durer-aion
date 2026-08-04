import {
  strategyGameFactory,
  type Ctx, type MoveOutcome, type BotStrategy, type BoardClientProps,
  GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { cloneDeep, isEqual, sample, random, range } from 'lodash';
import { useTranslation } from '../../../language';

type Board = { piles: [number, number], leftRestriction: [boolean, boolean] }

const StonePile = ({ count, onClick, disabled, restricted, hovered, hoverProps }) => {
  return (
    <button
      className={`w-full flex-1 flex flex-wrap content-start justify-center gap-2 p-2
        ${restricted ? 'opacity-50' : ''}`}
      style={{ transform: 'scaleY(-1)' }}
      onClick={onClick}
      disabled={disabled}
      {...hoverProps}
    >
      {range(count).map(i => (
        <div
          key={i}
          className={`w-[20%] aspect-square rounded-full bg-stone-500 shadow-md shadow-stone-700
            transition-opacity ${hovered && i === count - 1 ? 'opacity-30' : ''}`}
          style={{ transform: 'scaleY(-1)' }}
        />
      ))}
    </button>
  );
};

// The pile must have a stone left, and the left pile is closed to a player who
// took from it on their previous turn. The restriction is recorded per player,
// so this is one of the games where whose move it is genuinely decides what is
// legal — not merely whose turn it is.
export const isRemovalAllowed = (board: Board, player: number, pileId: number): boolean =>
  (pileId === 0 || pileId === 1)
    && board.piles[pileId] > 0
    && !(pileId === 0 && board.leftRestriction[player]);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { value: hoveredPile, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  const isMoveAllowed = pileId => moves.removeStone.isAllowed(board, pileId);

  return (
    <GameBoard>
      <div className="flex">
        {[0, 1].map(pileId => (
          <div key={pileId} className="grow px-2 flex flex-col">
            <h2 className="text-center">
              {t(pileId === 0 ? { hu: 'Bal', en: 'Left' } : { hu: 'Jobb', en: 'Right' })}
              {': ' + board.piles[pileId]}
            </h2>
            <StonePile
              count={board.piles[pileId]}
              onClick={() => moves.removeStone(board, pileId)}
              disabled={!isMoveAllowed(pileId)}
              restricted={ctx.isClientMoveAllowed && !isMoveAllowed(pileId)}
              hovered={hoveredPile === pileId}
              hoverProps={isMoveAllowed(pileId) ? hoverProps(pileId) : {}}
            />
          </div>
        ))}
      </div>
    </GameBoard>
  );
};

export const moves = {
  removeStone: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, pileId) =>
      isRemovalAllowed(board, ctx.currentPlayer!, pileId),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileId): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.piles[pileId] = board.piles[pileId] - 1;
      nextBoard.leftRestriction[ctx.currentPlayer!] = (pileId === 0);
      if (isGameEnd(nextBoard, ctx)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const isGameEnd = (board, ctx) => {
  if (isEqual(board.piles, [0, 0])) {
    return true;
  }
  if (board.piles[1] === 0 && board.leftRestriction[1 - ctx.currentPlayer]) {
    return true;
  }
  return false;
}

type Bot = BotStrategy<Board, Moves>

const randomBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'removeStone', args: [getPileOfRandomAllowedMove(board, ctx)] });

const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (board.leftRestriction[ctx.currentPlayer!]) {
    return { move: 'removeStone', args: [1] };
  }
  const optimalMove = getOptimalMove(board, ctx);
  const botMove = optimalMove !== undefined
    ? optimalMove
    : getPileOfRandomAllowedMove(board, ctx);
  return { move: 'removeStone', args: [botMove] };
};

// return undefined if there is no winning move
const getOptimalMove = (board, ctx) => {
  const otherPlayer = 1 - ctx.currentPlayer;
  const parity = [board.piles[0] % 2 === 0, board.piles[1] % 2 === 0]

  if (parity[0] && parity[1]) {
    if (!board.leftRestriction[otherPlayer]) {
      return undefined;
    } else if (board.leftRestriction[ctx.currentPlayer]) {
      console.error("Unexpected internal state, please report.")
      return undefined;
    } else {
      /*
      If we take right, the other must take right, then we are in an even-even
      position without any restriction which is a losing position. Check winning
      move in next round if we take left (and the other must take right). If
      there is a winning move next round it means taking from left now is also a
      winning move. Otherwise we do not have a winning move.
      */
      const nextRestriction = [false, false];
      nextRestriction[ctx.currentPlayer] = true;
      nextRestriction[1 -ctx.currentPlayer] = false;
      const nextBoard = {
        piles: [board.piles[0] - 1, board.piles[1] - 1],
        leftRestriction: nextRestriction
      }
      const optimalMoveInNextRound = getOptimalMove(nextBoard, ctx);
      return optimalMoveInNextRound !== undefined ? 0 : undefined;
    }
  }
  if (parity[0] && !parity[1]) {
    return 1;
  }
  if (!parity[0] && !parity[1]) {
    if (board.piles[0] > board.piles[1]) {
      return 1;
    } else {
      return undefined;
    }
  }
  if (!parity[0] && parity[1]) {
    if (board.piles[0] <= (board.piles[0] + 1)) {
      if (!board.leftRestriction[ctx.currentPlayer]) {
        return 0;
      } else {
        console.error("Unexpected internal state, please report.")
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // we should not reach this branch;
  return undefined;
}

const getPileOfRandomAllowedMove = (board, ctx) => {
  if (board.piles[0] === 0) return 1;
  if (board.piles[1] === 0) return 0;
  if (board.leftRestriction[ctx.currentPlayer]) return 1;
  return random(0, 1);
}

const rule = {
  hu: <>
    Két kupacban kavicsok vannak elhelyezve. A két játékos felváltva
    lép, és minden lépés során egy kavicsot kell elvenniük valamelyik kupacból.
    Egy játékos azonban nem vehet el két egymást követő lépésben a bal oldali
    kupacból. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are two piles of stones. Players alternate turns, and on each turn a player must
    remove one stone from either pile. However, a player may not take from the
    left pile on two consecutive turns. The player who cannot move loses.
  </>
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints a kupacra ahonnan el szeretnél venni egy kavicsot.',
  en: 'Click the pile you want to remove a stone from.'
});

const generateTestStartBoard = (): Board => ({
  piles: sample([[3, 4], [4, 3], [3, 3], [4, 4]]),
  leftRestriction: [false, false]
});

const generateStartBoard = (): Board => {
  const piles = sample([
    [11, 8],
    [9, 9],
    [9, 8],
    [9, 7],
    [5, 8],
    [8, 7],
    [6, 4]
  ]) as [number, number]
  return {
    piles,
    leftRestriction: [false, false]
  };
}

export const StonesRemoveOneNotTwiceFromLeft = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
