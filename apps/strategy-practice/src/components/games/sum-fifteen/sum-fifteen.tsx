import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { allNumbers, findWinningTriple, startBoard, moves, numbersOwnedBy, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const ownedLabel = (owner: Board['owner'], player: 0 | 1): string => {
  const nums = numbersOwnedBy(owner, player);
  return nums.length > 0 ? nums.join(', ') : '–';
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('sum-fifteen');
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
        {t('board.playerNumbers')}
      </>;
    }
    const isHuman = player === ctx.chosenRoleIndex;
    return <>
      <span className={colorClass}>
        {isHuman ? t('board.yourNumbers') : t('board.computerNumbers')}
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

const Rule = () => {
  const { t } = useTranslation('sum-fifteen');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('sum-fifteen');
  return t('step');
};

export const SumFifteen = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: [startBoard],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
