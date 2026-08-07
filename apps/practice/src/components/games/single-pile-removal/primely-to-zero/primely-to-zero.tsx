import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { range } from 'lodash';
import { generateStartBoard, maxStart, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  return (
    <GameBoard>
      <div className="flex flex-wrap gap-2">
        {range(maxStart + 1).map(i =>
          <button
            key={i}
            disabled={!moves.moveTo.isAllowed(board, i)}
            onClick={() => moves.moveTo(board, i)}
            className={`
              border-2 rounded-sm text-2xl min-w-[4ch] p-1 my-1 font-bold
              enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
              ${i === 0 ? 'border-slate-900 dark:border-slate-400 border-dashed' : ''}
              ${i > board ? 'opacity-50' : ''}
            `}
          >
            {i === board ? 'X' : i}
          </button>
        )}
      </div>
    </GameBoard>
  );
};

const rule = {
  hu: <>
    A bábu a 30 és 80 közé eső egyik mezőről indul. A soron következő játékos a bábut egy kisebb
    sorszámú mezőre lépteti, de a lépés mérete (a két mező sorszámának különbsége) sosem lehet
    összetett szám. Az nyer, aki a 0 mezőre lép.
  </>,
  en: <>
    The piece starts on a field numbered between 30 and 80. On each turn, the current player moves
    the piece to a lower-numbered field, but the step size (the difference between the two field
    numbers) can never be a composite number. The player who reaches field 0 wins.
  </>
};

export const PrimelyToZero = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válaszd ki, melyik mezőre lépsz.',
      en: 'Choose which field to move to.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
