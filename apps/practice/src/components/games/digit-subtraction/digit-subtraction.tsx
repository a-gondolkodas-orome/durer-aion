import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { generateStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const digits = String(board).split('').map(Number);

  return (
    <GameBoard>
      <div className="flex gap-2 flex-wrap justify-center">
        {digits.map((d, i) => (
          <button
            key={i}
            disabled={!moves.subtractDigit.isAllowed(board, d)}
            onClick={() => moves.subtractDigit(board, d)}
            className="secondary-button border-2 text-3xl sm:text-5xl w-12 sm:w-16 py-2 sm:py-3 font-bold"
          >
            {d}
          </button>
        ))}
      </div>
    </GameBoard>
  );
};

const rule = {
  hu: <>
    A játék egy pozitív egész számmal indul. Minden lépésben a soron következő játékos
    kiválasztja az aktuális szám egyik nem 0 számjegyét, és kivonja belőle. Az nyer, aki 0-t ér el.
  </>,
  en: <>
    The game starts with a positive integer. On each turn, the current player picks one of the
    non-zero digits of the current number and subtracts it. The player who reaches 0 wins.
  </>
};

export const DigitSubtraction = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz egy számjegyet, amelyet kivonsz az aktuális számból.',
      en: 'Choose a digit to subtract from the current number.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
