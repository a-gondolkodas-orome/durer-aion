import { strategyGameFactory, type MoveOutcome } from '../../strategy-game-factory';
import {
  type Board, type Coef, COEFS, hasThreeIntegerRoots, isCoefficientChoiceAllowed
} from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

export const moves = {
  setCoefficient: {
    validate: (board: Board, _, coef: Coef, value: number) =>
      isCoefficientChoiceAllowed(board, coef, value),
    apply: (board: Board, _, coef: Coef, value: number): MoveOutcome<Board> => {
      const nextBoard = { ...board, [coef]: value };
      const filled = nextBoard.a !== null && nextBoard.b !== null && nextBoard.c !== null;
      if (filled) {
        // A (player 0) wins iff all three roots are integers; otherwise B (player 1).
        const winnerIndex = hasThreeIntegerRoots(nextBoard.a!, nextBoard.b!, nextBoard.c!) ? 0 : 1;
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const rule = {
  hu: <>
    Legyen <code className="whitespace-nowrap">P(x) = x³ + ax² + bx + c</code> egy polinom.
    Két játékos felváltva határozza
    meg a, b, c értékeit. Tetszőleges sorrendben választanak a, b, c értékeinek
    egész számokat. Az első játékos célja, hogy a polinomnak mindhárom gyöke
    egész legyen. A második játékos célja, hogy ezt megakadályozza.
  </>,
  en: <>
    Let <code className="whitespace-nowrap">P(x) = x³ + ax² + bx + c</code> be a polynomial.
    Two players alternately
    determine the values of a, b, c. In any order, they choose integer values
    for a, b, c. The first player's goal is for all three roots of the
    polynomial to be integers. The second player's goal is to prevent this.
  </>
};

export const PolynomialBuilding = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: '1. játékos (egész gyökök)', en: '1st player (integer roots)' },
      { hu: '2. játékos', en: '2nd player' }
    ],
    getPlayerStepDescription: ({ board }: { board: Board }) => {
      const remaining = COEFS.filter(coef => board[coef] === null);
      const list = (conj: string) => remaining.length === 1
        ? remaining[0]
        : `${remaining.slice(0, -1).join(', ')} ${conj} ${remaining[remaining.length - 1]}`;
      return remaining.length === 1
        ? {
          hu: `Állítsd be az utolsó együtthatót (${list('vagy')}) egy egész számra.`,
          en: `Set the last remaining coefficient (${list('or')}) to an integer.`
        }
        : {
          hu: `Állítsd be az egyik hátralévő együtthatót (${list('vagy')}) egy egész számra.`,
          en: `Set one of the remaining coefficients (${list('or')}) to an integer.`
        };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => ({ a: null, b: null, c: null }),
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
