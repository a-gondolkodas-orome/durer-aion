import { range, sample, difference } from 'lodash';
import {
  strategyGameFactory, type Ctx, type MoveOutcome, type BoardClientProps, GameBoard
} from '../../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useTranslation } from '../../../../language';

export type Board = { current: number, target: number, restricted: number | null }

// A step adds a positive whole number below 13, and superstition forbids the one
// that would complete 13 together with the previous player's step.
export const isStepAllowed = (board: Board, step: number): boolean =>
  Number.isInteger(step) && step > 0 && step < 13 && step !== board.restricted;

const generateStartBoard = (): Board => {
  const losingPositions = range(29, 127, 14);
  const winningPositions = difference(range(26, 115), losingPositions);
  const target = sample([sample(losingPositions), sample(winningPositions)])!;
  return { current: 0, target, restricted: null };
};

const generateTestStartBoard = (): Board => {
  const losingPositions = [29];
  const winningPositions = difference(range(26, 33), losingPositions);
  const target = sample([sample(losingPositions), sample(winningPositions)])!;
  return { current: 0, target, restricted: null };
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const fields = range(board.target + 14);


  return (
  <GameBoard>
    <div className="flex flex-wrap gap-2">
      {fields.map(i =>
        <button
          key={i}
          disabled={!moves.step.isAllowed(board, i - board.current)}
          onClick={() => moves.step(board, i - board.current)}
          className={`
            border-2 rounded-sm text-2xl min-w-[4ch] py-1 font-bold
            enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
            ${board.restricted && i === board.current + board.restricted ? 'bg-red-200 dark:bg-red-900' : '' }
            ${i < board.current ? 'opacity-50' : ''}
            ${i >= board.target ? 'opacity-50 border-purple-600' : ''}
          `}
        >{ i === board.current ? 'X' : i }
      </button>
      )}
    </div>
    <p className="text-xl mt-2">
      {t({
        hu: `m értéke: ${board.target}`,
        en: `Value of m: ${board.target}`
      })}
    </p>
    {ctx.isClientMoveAllowed && (
      <p className="text-xl mt-2">
        {t({
          hu: `Előző lépés: ${board.restricted ? (13 - board.restricted) : '-'}. ` +
            `Tiltott: ${ board.restricted || '-' }.`,
          en: `Previous step: ${board.restricted ? (13 - board.restricted) : '-'}. ` +
            `Forbidden: ${board.restricted || '-'}.`
        })}
      </p>
    )}
  </GameBoard>
  );
};

export const moves = {
  step: {
    validate: (board: Board, _, step: number) => isStepAllowed(board, step),
    apply: (board: Board, { ctx }: { ctx: Ctx }, step): MoveOutcome<Board> => {
      const numberAfterStep = board.current + step;
      const nextBoard = { current: numberAfterStep, target: board.target, restricted: 13 - step };
      if (numberAfterStep >= board.target) {
        return { nextBoard, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const rule = {
  hu: <>
    Károly és Dezső <code>m</code>-ig szeretnének elszámolni, és közben a következő játékot játsszák:
    0-ról kezdenek, a két játékos felváltva adhat hozzá egy 13-nál (szigorúan) kisebb pozitív egészet a korábbi
    számhoz, azonban a babonájuk miatt ha egyikük <code>x</code>-et adott hozzá, akkor másikuk a következő
    lépésben nem adhat hozzá <code>13-x</code>-et. Az veszít, aki eléri (vagy átlépi) <code>m</code>-et.
  </>,
  en: <>
    Károly and Dezső wish to count up to <code>m</code> and play the following game in the
    meantime: they start from 0 and the two players can add a positive number less than 13 to the
    previous number, taking turns. However because of their superstition, if one of them added <code>x</code>,
    then the other one in the next step cannot add <code>13-x</code>. The first player to reach
    or exceed <code>m</code> loses.
  </>
};

export const SuperstitiousCounting = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints a számra ahova lépni szeretnél.',
      en: 'Click on a number to step onto it.'
    })
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
