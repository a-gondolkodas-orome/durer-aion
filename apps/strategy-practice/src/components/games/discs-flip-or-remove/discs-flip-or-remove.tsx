import {
  strategyGameFactory, testVariantLabel, type BoardClientProps, GameBoard, useHoverPreview
} from 'strategy-game-factory';
import { range, isEqual } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { generateStartBoard, generateTestStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const DisabledDisc = ({ bgColor }: { bgColor: string }) => (
  <button className={`size-12 rounded-full ${bgColor}`} disabled />
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('discs-flip-or-remove');
  const { value: validHovered, hoverProps } = useHoverPreview<[number, number]>(ctx.moveCount);

  // Clicking the i-th disc of a pile takes everything above it, i.e.
  // board[pile] - i discs. The blue pile is removed from, the red one flipped.
  const moveForPile = (pile: number) => (pile === 0 ? moves.removeDiscs : moves.turnDiscs);

  const isSelectable = (pile: number, i: number) =>
    moveForPile(pile).isAllowed(board, board[pile] - i);

  const select = (pile: number, i: number) => moveForPile(pile)(board, board[pile] - i);

  const isSelected = (pile: number, i: number) =>
    isEqual(validHovered, [pile, i]) || isEqual(validHovered, [pile, i - 1]);

  const fmt = (red: number, blue: number) => ` → ${t('board.discs', { red, blue })}`;

  const nextBoardDescription = () => {
    if (validHovered === null) return '';
    if (!ctx.isClientMoveAllowed) return '';
    const count = board[validHovered[0]] - validHovered[1];
    if (validHovered[0] === 0) return fmt(board[1], board[0] - count);
    return fmt(board[1] - count, board[0] + count);
  };


  return (
    <GameBoard>
      <div className="flex flex-wrap gap-1">
        {range(board[1]).map((i) =>
          board[1] > i + 2
            ? <DisabledDisc key={`red-disabled-${i}`} bgColor="bg-red-800"/>
            : (
              <button
                key={`red-${i}-${board[0]}-${board[1]}`}
                className={`size-12 rounded-full ${
                  ctx.isClientMoveAllowed && isSelected(1, i)
                    ? 'bg-blue-800/75'
                    : 'bg-red-800'
                }`}
                disabled={!isSelectable(1, i)}
                onClick={() => select(1, i)}
                {...hoverProps([1, i])}
              />
            )
        )}

        {range(board[0]).map((i) =>
          board[0] > i + 2
            ? <DisabledDisc key={`blue-disabled-${i}`} bgColor="bg-blue-800"/>
            : (
              <button
                key={`blue-${i}-${board[0]}-${board[1]}`}
                className={`size-12 rounded-full bg-blue-800 ${isSelected(0, i) ? 'enabled:opacity-50' : ''}`}
                disabled={!isSelectable(0, i)}
                onClick={() => select(0, i)}
                {...hoverProps([0, i])}
              />
            )
        )}
      </div>
      {t('board.discs', { red: board[1], blue: board[0] })}
      {nextBoardDescription()}
    </GameBoard>
  );
};

const StepDescription = () => {
  const { t } = useTranslation('discs-flip-or-remove');
  return t('step');
};

const Rule = ({ maxDiscs }: { maxDiscs?: number }) => {
  const { t } = useTranslation('discs-flip-or-remove');
  if (maxDiscs === undefined) return <Trans t={t} i18nKey="rule.generic" />;
  return <Trans t={t} i18nKey="rule.bounded" values={{ maxDiscs }} />;
};

export const DiscsFlipOrRemove = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(6),
      rule: <Rule maxDiscs={6} />,
      label: t => t('discs-flip-or-remove:variant.sixDiscs'),
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(10),
      rule: <Rule maxDiscs={10} />,
      label: t => t('discs-flip-or-remove:variant.tenDiscs')
    }
  ]
});
