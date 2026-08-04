import {
  strategyGameFactory,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from '../../../strategy-game-factory';
import { useTranslation } from '../../../../language';
import { generateStartBoard, generateTestStartBoard, getAvailableExponents, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

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
        isPowerAllowed={(e: number) => moves.subtractPowerOfTwo.isAllowed(board, e)}
        board={board}
        choosePower={(e: number) => moves.subtractPowerOfTwo(board, e)}
        hovered={hoveredPower}
        hoverProps={hoverProps}
      />
    </GameBoard>
  );
}

const getPlayerStepDescription = () => ({
  hu: 'Válaszd ki a 2 hatványát amit ki szeretnél vonni.',
  en: 'Choose a power of 2 to subtract.'
});

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
