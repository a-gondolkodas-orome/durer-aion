import {
  strategyGameFactory,
  testVariantLabel,
  fullVariantLabel,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from 'strategy-game-factory';
import { random, range } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { moves, type Board, type HoveredAction } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const CoinPile = ({ count, hoveredAction }: { count: number, hoveredAction: HoveredAction }) => (
  <div className="flex flex-wrap justify-center gap-2 p-4" style={{ transform: 'scaleY(-1)' }}>
    {range(count).map(i => {
      const isDimmed =
        (hoveredAction === 'take1' && i === count - 1) ||
        (hoveredAction === 'halve' && i >= count / 2);
      return (
        <div
          key={i}
          className={`w-[11%] aspect-square rounded-full bg-yellow-400 shadow-md shadow-yellow-600
            transition-opacity ${isDimmed ? 'opacity-30' : ''}`}
          style={{ transform: 'scaleY(-1)' }}
        />
      );
    })}
  </div>
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('single-pile-removal');
  const { value: hoveredAction, hoverProps } = useHoverPreview<'take1' | 'halve'>(ctx.moveCount);
  const canTake1 = moves.take1.isAllowed(board);
  const canHalve = moves.halve.isAllowed(board);
  return (
    <GameBoard>
      <h2 className="text-center">{board}</h2>
      <CoinPile count={board} hoveredAction={hoveredAction} />
      <div className="flex flex-wrap gap-2">
        <button
          className="primary-button w-auto grow"
          disabled={!canTake1}
          onClick={() => moves.take1(board)}
          {...(canTake1 ? hoverProps('take1') : {})}
        >{t('take1OrHalve.board.takeOne')}</button>
        <button
          className="primary-button w-auto grow"
          disabled={!canHalve}
          onClick={() => moves.halve(board)}
          {...(canHalve ? hoverProps('halve') : {})}
        >{t('take1OrHalve.board.takeHalf')}</button>
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('single-pile-removal');
  return <Trans t={t} i18nKey="take1OrHalve.rule" />;
};

const StepDescription = ({ board }: { board: Board }) => {
  const { t } = useTranslation('single-pile-removal');
  return board % 2 === 1 ? t('take1OrHalve.step.odd') : t('take1OrHalve.step.even');
};

export const Take1OrHalve = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ board }) => <StepDescription board={board} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: () => random(5, 10),
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => random(20, 27),
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
