import {
  strategyGameFactory, type MoveOutcome, type Ctx, type BotStrategy, type BoardClientProps, GameBoard
} from '../../strategy-game-factory';
import { useTranslation } from '../../../language';
import {
  allNumbers, generateStartBoard, numbersOwnedBy, currentPlayerFromOwner,
  hasSum15, findWinningTriple, chooseSmartMove, chooseTestMove, isChoiceAllowed, type Board
} from './helpers';

const ownedLabel = (owner: Board['owner'], player: 0 | 1): string => {
  const nums = numbersOwnedBy(owner, player);
  return nums.length > 0 ? nums.join(', ') : '–';
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { owner } = board;

  const winningTriple = ctx.phase === 'gameEnd' && ctx.winnerIndex !== null
    ? (findWinningTriple(numbersOwnedBy(owner, ctx.winnerIndex as 0 | 1)) ?? [])
    : [];

  const ownerLabel = (player: 0 | 1) => {
    const colorClass = player === 0
      ? 'font-bold text-red-700 dark:text-red-400'
      : 'font-bold text-blue-700 dark:text-blue-400';
    if (ctx.isHumanVsHumanGame) {
      return <>
        <span className={colorClass}>{ctx.resolvedPlayerNames[player]}</span>
        {t({ hu: ' számai: ', en: "'s numbers: " })}
      </>;
    }
    const isHuman = player === ctx.chosenRoleIndex;
    return <>
      <span className={colorClass}>
        {t(isHuman
          ? { hu: 'A te számaid', en: 'Your numbers' }
          : { hu: 'A gép számai', en: "Computer's numbers" })}
      </span>
      {': '}
    </>;
  };

  const numberClass = (n: number) => {
    const o = owner[n - 1];
    const base = 'rounded-lg border-2 text-2xl w-12 py-2 font-bold transition-colors';
    const highlight = winningTriple.includes(n) ? ' ring-2 ring-amber-500' : '';
    if (o === 0) return `${base}${highlight} bg-red-700 border-red-700 text-white`;
    if (o === 1) return `${base}${highlight} bg-blue-700 border-blue-700 text-white`;
    return `${base} border-slate-500 bg-surface-elevated
      enabled:hocus:bg-blue-100 dark:enabled:hocus:bg-blue-900
      enabled:hocus:border-blue-300 disabled:opacity-60`;
  };

  return (
    <GameBoard>
      <div className="flex gap-3 flex-wrap justify-center">
        {allNumbers.map(n => (
          <button
            key={n}
            disabled={!moves.chooseNumber.isAllowed(board, n)}
            onClick={(e) => { moves.chooseNumber(board, n); e.currentTarget.blur(); }}
            className={numberClass(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {ctx.phase !== 'roleSelection' &&
        <div className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>{ownerLabel(0)}{ownedLabel(owner, 0)}</p>
          <p>{ownerLabel(1)}{ownedLabel(owner, 1)}</p>
        </div>
      }
    </GameBoard>
  );
};

export const moves = {
  chooseNumber: {
    validate: (board: Board, _, n: number) => isChoiceAllowed(board.owner, n),
    apply: (board: Board, { ctx }: { ctx: Ctx }, n: number): MoveOutcome<Board> => {
      const player = ctx.currentPlayer as 0 | 1;
      const owner = board.owner.slice() as Board['owner'];
      owner[n - 1] = player;
      const nextBoard = { owner };

      if (hasSum15(numbersOwnedBy(owner, player))) {
        return { nextBoard, gameEnd: { winnerIndex: player } };
      }
      if (owner.every(o => o !== null)) {
        // All nine numbers claimed, nobody reached a triple summing to 15.
        return { nextBoard, gameEnd: { winnerIndex: 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

type Bot = BotStrategy<Board, Moves>

const smartBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseSmartMove(board.owner, player)] };
};

const randomBotStrategy: Bot = ({ board, ctx }) => {
  const player = (ctx.currentPlayer ?? currentPlayerFromOwner(board.owner)) as 0 | 1;
  return { move: 'chooseNumber', args: [chooseTestMove(board.owner, player)] };
};

const rule = {
  hu: <>
    Adottak 1-től 9-ig a számok. A két játékos felváltva kiválaszt magának egy olyan számot, amit
    korábban még senki sem választott. Az a játékos nyer, akinek először megtalálható a saját számai
    között három darab, melyek összege 15. Ha már mind a kilenc szám megtalálható valakinél, és egyik
    játékosnál sem található három szám, melyek összege 15, akkor a második játékos nyert.
  </>,
  en: <>
    The numbers 1 to 9 are given. The two players alternately pick a number that nobody has chosen
    before. A player wins as soon as three of their own numbers add up to 15. If all nine numbers have
    been claimed and neither player has three numbers summing to 15, then the second player wins.
  </>
};

export const SumFifteen = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz egy még szabad számot.',
      en: 'Choose one of the still-available numbers.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // smart bot: full optimal search (see winnerOptimal in helpers.ts)
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
