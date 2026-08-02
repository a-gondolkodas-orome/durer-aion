import {
  strategyGameFactory, type Ctx, type MoveOutcome, type StrategyArgs, type BoardClientProps,
  GameBoard, useHoverPreview
} from '../../../strategy-game-factory';
import { range, random, reverse, sample } from 'lodash';
import { useTranslation } from '../../../../language';

const generateStartBoard = () => {
  if (random(0, 1)) {
    return random(10, 99) * 3;
  } else {
    return random(10, 99) * 3 + random(1, 2);
  }
};

type Board = number

const ExponentsTable = ({ isPowerAllowed, board, choosePower, hovered, hoverProps }) => {
  const { t } = useTranslation();
  const availableExponents = getAvailableExponents(board);

  if (availableExponents.length === 0) return <></>;

  return <>
    <p>{t({ hu: 'Lehetséges hatványok:', en: 'Available powers:' })}</p>
    <div className="flex flex-wrap gap-2">
      {availableExponents.map(e =>
        <button
          key={e}
          disabled={!isPowerAllowed(e)}
          className="secondary-button w-auto min-w-12"
          onClick={() => choosePower(e)}
          {...(isPowerAllowed(e) ? hoverProps(e) : {})}
        >{2 ** e}</button>
      )}
    </div>
    {hovered !== null && isPowerAllowed(hovered) && <p className="mt-2">
      {t({
        hu: `Kivonandó 2-hatvány: 2^${hovered} = ${2**hovered}. Eredmény: ${board-2**hovered}.`,
        en: `Power to subtract: 2^${hovered} = ${2**hovered}. Result: ${board-2**hovered}.`
      })}
    </p>}
  </>;
}


const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: hoveredPower, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  return (
    <GameBoard>
      <p className='w-full text-8xl font-bold text-center mb-4'>{board}</p>
      <ExponentsTable
        isPowerAllowed={(e: number) => moves.subtractPowerOfTwo.isAllowed!(board, e)}
        board={board}
        choosePower={(e: number) => moves.subtractPowerOfTwo(board, e)}
        hovered={hoveredPower}
        hoverProps={hoverProps}
      />
    </GameBoard>
  );
}

const generateTestStartBoard = () => {
  if (random(0, 1)) {
    return random(1, 9) * 3;
  } else {
    return random(1, 9) * 3 + random(1, 2);
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.subtractPowerOfTwo(board, sample(getAvailableExponents(board)));
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (board === 1) {
    moves.subtractPowerOfTwo(board, 0);
    return;
  }
  const availableExponents = getAvailableExponents(board);
  if (board % 3 === 0) {
    moves.subtractPowerOfTwo(board, sample(availableExponents));
  } else {
    const optimalMove = reverse(availableExponents).find(e => (board - 2 ** e) % 3 === 0);
    moves.subtractPowerOfTwo(board, optimalMove);
  }
}

const getAvailableExponents = (num: Board) => {
  if (num === 0) return [];
  const baseLog = Math.log(num) / Math.log(2);
  const maxExponent = Math.floor(baseLog);
  return range(0, maxExponent + 1);
}

const getPlayerStepDescription = () => ({
  hu: 'Válaszd ki a 2 hatványát amit ki szeretnél vonni.',
  en: 'Choose a power of 2 to subtract.'
});

export const moves = {
  subtractPowerOfTwo: {
    // A power of 2 may be subtracted only if it does not exceed the number —
    // exactly the exponents the board already offers.
    validate: (board: Board, _, exponent: number) => getAvailableExponents(board).includes(exponent),
    apply: (board: Board, { ctx }: { ctx: Ctx }, exponent: number): MoveOutcome<Board> => {
      const nextBoard = board - 2 ** exponent;
      if (nextBoard === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

const rule = {
  hu: <>
    Egy 300-nál kisebb, (gép által meghatározott) pozitív egész számtól kezdődik a játék,
    ebből a játékosok felváltva vonnak le egy tetszőleges
    2-hatványt. Az nyer, aki a nullát mondja!
  </>,
  en: <>
    The game starts from a positive integer below 300 chosen by the computer.
    Players alternate subtracting any power of 2.
    The player who reaches zero wins!
  </>
};

export const TakePowerOfTwo = strategyGameFactory({
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
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
