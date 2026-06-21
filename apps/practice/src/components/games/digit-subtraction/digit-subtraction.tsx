import { sample } from 'lodash';
import {
  strategyGameFactory,
  type Ctx, type Events, type StrategyArgs, type BoardClientProps,
  GameBoard
} from '../../game-factory';

type Board = number

const digitsOf = (n: number): number[] =>
  String(n).split('').map(Number).filter(d => d !== 0);

const uniqueNonZeroDigits = (n: number): number[] =>
  [...new Set(digitsOf(n))];

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const digits = String(board).split('').map(Number);

  return (
    <GameBoard>
      <div className="flex gap-2 flex-wrap justify-center">
        {digits.map((d, i) => (
          <button
            key={i}
            disabled={!ctx.isClientMoveAllowed || d === 0}
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

const moves = {
  subtractDigit: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, digit: number) => {
    const nextBoard = board - digit;
    if (nextBoard === 0) {
      events.endGame(ctx.currentPlayer!);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const digits = uniqueNonZeroDigits(board);
  const winningDigits = digits.filter(d => board - d === 0);
  moves.subtractDigit(board, sample(winningDigits.length > 0 ? winningDigits : digits)!);
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (board % 10 !== 0) {
    moves.subtractDigit(board, board % 10);
  } else {
    moves.subtractDigit(board, sample(uniqueNonZeroDigits(board))!);
  }
};

const generateStartBoard = (): Board => {
  if (Math.random() < 0.3) {
    // multiple of 10 → P2 wins (losing position for P1)
    return (Math.floor(Math.random() * 10) + 2) * 10;
  } else {
    // non-multiple of 10 → P1 wins
    let n: number;
    do { n = Math.floor(Math.random() * 180) + 21; } while (n % 10 === 0);
    return n;
  }
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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
