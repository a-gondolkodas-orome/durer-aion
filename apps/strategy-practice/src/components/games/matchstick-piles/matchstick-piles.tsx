import { Fragment } from 'react';
import { range, random } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, type BoardClientProps, GameBoard, useHoverPreview, testVariantLabel, fullVariantLabel
} from 'strategy-game-factory';
import { generateStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

type Hover =
  | { pileId: number; kind: 'remove' }
  | { pileId: number; kind: 'split'; splitAfter: number };

const Matchstick = ({ removed }: { removed: boolean }) => (
  <span className="relative block w-2 h-9">
    <span className={`
      absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full
      ${removed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-red-600'}
    `} />
    <span className={`
      absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm
      ${removed ? 'bg-amber-200/40 dark:bg-amber-200/20' : 'bg-amber-300 dark:bg-amber-400'}
    `} />
  </span>
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: activeHover, hoverProps } = useHoverPreview<Hover>(ctx.moveCount);

  const canSplit = (pileId: number, splitAfter: number) =>
    moves.splitPile.isAllowed(board, pileId, splitAfter + 1);

  const pileDescription = (pileId: number, size: number) => {
    if (!activeHover || activeHover.pileId !== pileId) return `${size}`;
    if (activeHover.kind === 'remove') return `${size} → ${size - 1}`;
    const first = activeHover.splitAfter + 1;
    return `${size} → ${first}, ${size - first}`;
  };

  const isMatchRemoved = (pileId: number, matchId: number, size: number) =>
    activeHover?.kind === 'remove'
    && activeHover.pileId === pileId
    && matchId === size - 1;

  const isSplitActive = (pileId: number, splitAfter: number) =>
    activeHover?.kind === 'split'
    && activeHover.pileId === pileId
    && activeHover.splitAfter === splitAfter;

  return (
    <GameBoard>
      <div className="flex flex-wrap justify-center items-start gap-3 p-2">
        {board.map((size, pileId) => (
          <div
            key={pileId}
            className={`
              bg-surface-elevated rounded-md text-center px-2 pt-1 pb-2
              border border-slate-300 dark:border-slate-600
            `}
          >
            <p className="text-lg font-semibold mb-1 tabular-nums">
              {pileDescription(pileId, size)}
            </p>
            <div className="flex items-end justify-center">
              {range(size).map(matchId => (
                <Fragment key={matchId}>
                  {matchId > 0 && (
                    <button
                      type="button"
                      aria-label="split pile here"
                      disabled={!canSplit(pileId, matchId - 1)}
                      className="self-stretch w-4 flex items-center justify-center group"
                      onClick={() => moves.splitPile(board, pileId, matchId)}
                      {...(canSplit(pileId, matchId - 1)
                        ? hoverProps({ pileId, kind: 'split', splitAfter: matchId - 1 })
                        : {})}
                    >
                      <span className={`
                        w-0.5 h-9 rounded-full transition-colors
                        ${isSplitActive(pileId, matchId - 1)
                          ? 'bg-blue-600'
                          : 'bg-transparent group-enabled:group-hover:bg-blue-300'}
                      `} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="remove a match from this pile"
                    disabled={!moves.removeMatch.isAllowed(board, pileId)}
                    className={`
                      p-1 rounded-sm
                      enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700
                    `}
                    onClick={() => moves.removeMatch(board, pileId)}
                    {...(moves.removeMatch.isAllowed(board, pileId) ? hoverProps({ pileId, kind: 'remove' }) : {})}
                  >
                    <Matchstick removed={isMatchRemoved(pileId, matchId, size)} />
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('matchstick-piles');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('matchstick-piles');
  return t('step');
};

export const MatchstickPiles = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: () => range(random(2, 3)).map(() => random(2, 5)),
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
