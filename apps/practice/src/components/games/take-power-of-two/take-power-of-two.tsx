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

const ExponentCell = ({ e, choosePower, setHovered }) => {
  return <td
    className="border-4 hocus:bg-gray-300"
    key={e}>
    <button
      className={`w-full p-[5%] aspect-video cursor-pointer`}
      onClick={() => choosePower(e)}
      onMouseOver={() => setHovered(e)}
      onMouseOut={() => setHovered(null)}
      onFocus={() => setHovered(e)}
      onBlur={() => setHovered(null)}
    >{2 ** e}
    </button>
  </td>
}

const ExponentsTable = ({ board, choosePower, hovered, setHovered }) => {
  const { t } = useTranslation();
  const availableExponents = getAvailableExponents(board);

  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
  // if we dynamically generate, tailwind won't recognize them :(
  const widthClassNames = [
    "",
    "w-[10%] min-w-[10%]",
    "w-[20%] min-w-[20%]",
    "w-[30%] min-w-[30%]",
    "w-[40%] min-w-[40%]",
    "w-[50%] min-w-[50%]",
    "w-[60%] min-w-[60%]",
    "w-[70%] min-w-[70%]",
    "w-[80%] min-w-[80%]",
    "w-[90%] min-w-[90%]",
    "w-full min-w-full"
  ][availableExponents.length]

  return <>
    <p>{t({ hu: 'Lehetséges hatványok:', en: 'Available powers:' })}</p>
    <table className={`border-collapse table-fixed ${widthClassNames}`}>
      <tbody><tr>
        {availableExponents.map(e =>
          <ExponentCell
            key={e}
            e={e}
            choosePower={choosePower}
            setHovered={setHovered}
          ></ExponentCell>
        )}
      </tr></tbody>
    </table>
    {hovered === null ? <br></br> : <p>
      {t({ hu: `Kivonandó 2-hatvány: 2^${hovered} = ${2**hovered}. Eredmény: ${board-2**hovered}.`,
        en: `Power to subtract: 2^${hovered} = ${2**hovered}. Result: ${board-2**hovered}.` })}
    </p>}
  </>;
}


const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [hoveredPower, setHoveredPower] = useState(null);

  const choosePower = (e: number) => {
    moves.subtractPowerOfTwo(board, e);
    setHoveredPower(null);
  }

  return (
    <GameBoard>
      <p className='w-full text-8xl font-bold text-center mb-4'>{board}</p>
      {!ctx.isClientMoveAllowed
        ? ''
        : <ExponentsTable
          board={board}
          choosePower={choosePower}
          hovered={hoveredPower}
          setHovered={setHoveredPower}
        ></ExponentsTable>}
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
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
