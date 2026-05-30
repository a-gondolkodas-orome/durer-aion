import {
  strategyGameFactory, type Events, type BoardClientProps, type StrategyArgs, GameBoard
} from '../../game-factory';
import { range, cloneDeep, random, sample } from 'lodash';
import { smartBotStrategy } from './bot-strategy';

export type Board = { circle: boolean[], lastMove: number | null, firstMove: number | null }

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const getCoords = (index) => {
    const step = Math.PI * 2/board.circle.length;
    const angle = index * step + (board.firstMove === null ? 0 : board.firstMove * step);
    return { x: 55 + 50 * Math.cos(angle), y: 55 + 50 * Math.sin(angle) };
  };

  const isAllowedMove = index => {
    if (!ctx.isClientMoveAllowed) return false;
    return isAllowedBank(index);
  }

  const isAllowedBank = index => {
    return getAllowedBanks(board).includes(index);
  }

  const clickBank = (index) => {
    if (!isAllowedMove(index)) return;
    moves.rob(board, index);
  }

  const getBankColor = index => {
    if (index === board.lastMove) return "fill-red-800 stroke-red-600";
    if (board.circle[index] === false) return "fill-red-800";
    if (!isAllowedBank(index)) return "fill-slate-400";
    return "fill-green-600";
  }

  return (
    <GameBoard>
      <svg width="100%" height="100%" viewBox='0 0 110 110'>
        {range(board.circle.length).map(index => {
          const { x, y } = getCoords(index);
          const prev = getCoords(index - 1);
          return (
            <line
              key={index}
              className="stroke-slate-600"
              x1={x} y1={y}
              x2={prev.x} y2={prev.y}
              strokeWidth={1.5}
            />
          );
        })}
        {range(board.circle.length).map(index => {
          const { x, y } = getCoords(index);
          return (
            <circle
              key={index}
              cx={x} cy={y}
              r="4%"
              className={`${getBankColor(index)}`}
              strokeWidth={index === board.lastMove ? "1%" : "0"}
              onClick={() => clickBank(index)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') clickBank(index);
              }}
              tabIndex={isAllowedMove(index) ? 0 : undefined}
              role={isAllowedMove(index) ? 'button' : undefined}
              aria-label={isAllowedMove(index) ? `Bank ${index + 1}` : undefined}
            />
          );
        })}
      </svg>
    </GameBoard>
  );
};

const moves = {
  rob: (board: Board, { events }: { events: Events }, index) => {
    const nextBoard = cloneDeep(board);
    // so that ai strategy can be simpler: first move is always the same
    const transformedMove = board.firstMove === null ? 0 : index;
    if (board.firstMove === null) {
      nextBoard.firstMove = index;
    }
    nextBoard.lastMove = transformedMove;
    nextBoard.circle[transformedMove] = false;
    events.endTurn();
    if (getAllowedBanks(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const getAllowedBanks = (board: Board) => {
  return range(board.circle.length).filter(i => {
    return board.circle[i] && (board.circle.at(i-1) || board.circle[(i+1)%board.circle.length]);
  })
}

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.rob(board, sample(getAllowedBanks(board))!);
};

const rule = {
  hu: <>
    Bergengócia fővárosában legalább 7 és legfeljebb 10 bank található, melyek körben,
    a Nagykörút mentén helyezkednek el. Két rivális bűnbanda ezen bankok kirablását tervezi,
    mégpedig úgy, hogy felváltva választanak ki egy-egy bankot. Nem választanak ki olyat,
    amit már korábban az egyikük kifosztott, és olyat sem, aminek már mindkét szomszédját kirabolták,
    mert ott már lesben áll a rendőrség. Az a banda veszt, aki már nem talál bankot, amit kirabolhat.
    <br /><em>C kategóriában 7, D kategóriában 9 bankkal szerepelt a feladat a versenyen.</em>
  </>,
  en: <>
    The capital of Bergengocia has between 7 and 10 banks arranged in a circle along the Grand Boulevard.
    Two rival gangs plan to rob these banks by taking turns selecting one bank at a time. They may not
    select a bank that has already been robbed, nor one whose both neighbours have already been robbed,
    as the police are lying in ambush there. The gang that can no longer find a bank to rob loses.
    <br /><em>In category C the problem used 7 banks, in category D it used 9 banks.</em>
  </>
};

const generateStartBoard = (): Board => {
  const n = random(0, 2) === 0 ? sample([8, 10])! : sample([7, 9])!;
  return {
    circle: Array(n).fill(true),
    lastMove: null,
    firstMove: null
  }
}

export const BankRobbers = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz egy kirabolható bankot.',
      en: 'Choose a bank that can be robbed.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
