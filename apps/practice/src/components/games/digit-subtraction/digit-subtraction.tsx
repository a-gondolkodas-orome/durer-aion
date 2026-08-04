import { sample } from 'lodash';
import {
  strategyGameFactory,
  type Ctx, type MoveOutcome, type BotStrategy, type BoardClientProps,
  GameBoard
} from '../../strategy-game-factory';

type Board = number

const digitsOf = (n: number): number[] =>
  String(n).split('').map(Number).filter(d => d !== 0);

const uniqueNonZeroDigits = (n: number): number[] =>
  [...new Set(digitsOf(n))];

// Only a non-zero digit that actually appears in the current number may be
// subtracted. Both players draw from the same number, so whose turn it is does
// not enter into legality.
export const isSubtractableDigit = (board: Board, digit: number): boolean =>
  Number.isInteger(digit) && digit >= 1 && digit <= 9
    && String(board).includes(String(digit));

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

export const moves = {
  subtractDigit: {
    validate: (board: Board, _, digit: number) => isSubtractableDigit(board, digit),
    apply: (board: Board, { ctx }: { ctx: Ctx }, digit: number): MoveOutcome<Board> => {
      const nextBoard = board - digit;
      if (nextBoard === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const randomBotStrategy: BotStrategy<Board> = ({ board }) => {
  const digits = uniqueNonZeroDigits(board);
  const winningDigits = digits.filter(d => board - d === 0);
  return { move: 'subtractDigit', args: [sample(winningDigits.length > 0 ? winningDigits : digits)!] };
};

const smartBotStrategy: BotStrategy<Board> = ({ board }) => {
  if (board % 10 !== 0) {
    return { move: 'subtractDigit', args: [board % 10] };
  } else {
    return { move: 'subtractDigit', args: [sample(uniqueNonZeroDigits(board))!] };
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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
