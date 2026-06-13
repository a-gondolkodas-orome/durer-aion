import { useState } from 'react';
import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from '../../game-factory';
import { range, random, reverse, sample } from 'lodash';
import { useTranslation } from '../../language';

const generateStartBoard = () => {
  if (random(0, 1)) {
    return random(10, 99) * 3;
  } else {
    return random(10, 99) * 3 + random(1, 2);
  }
};

type Board = number

const ExponentsTable = ({ disabled, board, choosePower, hovered, setHovered }) => {
  const { t } = useTranslation();
  const availableExponents = getAvailableExponents(board);

  if (availableExponents.length === 0) return <></>;

  return <>
    <p>{t({ hu: 'Lehetséges hatványok:', en: 'Available powers:' })}</p>
    <div className="flex flex-wrap gap-2">
      {availableExponents.map(e =>
        <button
          key={e}
          disabled={disabled}
          className="secondary-button w-auto min-w-12"
          onClick={() => choosePower(e)}
          onPointerEnter={() => setHovered(e)}
          onPointerMove={() => setHovered(e)}
          onPointerLeave={() => setHovered(null)}
          onFocus={() => setHovered(e)}
          onBlur={() => setHovered(null)}
        >{2 ** e}</button>
      )}
    </div>
    {hovered !== null && !disabled && <p className="mt-2">
      {t({
        hu: `Kivonandó 2-hatvány: 2^${hovered} = ${2**hovered}. Eredmény: ${board-2**hovered}.`,
        en: `Power to subtract: 2^${hovered} = ${2**hovered}. Result: ${board-2**hovered}.`
      })}
    </p>}
  </>;
}


const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [hoveredPower, setHoveredPower] = useState<{ value: number; moveCount: number } | null>(null);
  const validHoveredPower = hoveredPower?.moveCount === ctx.moveCount ? hoveredPower.value : null;

  const choosePower = (e: number) => {
    moves.subtractPowerOfTwo(board, e);
    setHoveredPower(null);
  }

  return (
    <GameBoard>
      <p className='w-full text-8xl font-bold text-center mb-4'>{board}</p>
      <ExponentsTable
        disabled={!ctx.isClientMoveAllowed}
        board={board}
        choosePower={choosePower}
        hovered={validHoveredPower}
        setHovered={(e: number | null) => setHoveredPower(e !== null ? { value: e, moveCount: ctx.moveCount } : null)}
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

const moves = {
  subtractPowerOfTwo: (board: Board, { events }: { events: Events }, exponent: number) => {
    const nextBoard = board - 2 ** exponent;
    events.endTurn();
    if (nextBoard === 0) {
      events.endGame();
    }
    return { nextBoard };
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
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    // smart bot: verified as optimal
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
