import {
  strategyGameFactory,
  testVariantLabel,
  fullVariantLabel,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from 'strategy-game-factory';
import { Trans, useTranslation } from 'react-i18next';
import { generateStartBoard, generateTestStartBoard, getAvailableExponents, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const ExponentsTable = (
  { isPowerAllowed, board, choosePower, hovered, hoverProps }: {
    isPowerAllowed: (exponent: number) => boolean;
    board: Board;
    choosePower: (exponent: number) => void;
    hovered: number | null;
    hoverProps: ReturnType<typeof useHoverPreview<number>>['hoverProps'];
  }
) => {
  const { t } = useTranslation('single-pile-removal');
  const availableExponents = getAvailableExponents(board);

  if (availableExponents.length === 0) return <></>;

  return <>
    <p>{t('takePowerOfTwo.board.availablePowers')}</p>
    <div className="flex flex-wrap gap-2">
      {availableExponents.map(e =>
        <button
          key={e}
          disabled={!isPowerAllowed(e)}
          className="secondary-button w-auto min-w-12"
          onClick={() => choosePower(e)}
          {...(isPowerAllowed(e) ? hoverProps(e) : {})}
        >{2 ** e}</button>
      )}
    </div>
    {hovered !== null && isPowerAllowed(hovered) && <p className="mt-2">
      {t('takePowerOfTwo.board.preview', {
        exponent: hovered, power: 2 ** hovered, result: board - 2 ** hovered
      })}
    </p>}
  </>;
}

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: hoveredPower, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  return (
    <GameBoard>
      <p className='w-full text-8xl font-bold text-center mb-4'>{board}</p>
      <ExponentsTable
        isPowerAllowed={(e: number) => moves.subtractPowerOfTwo.isAllowed(board, e)}
        board={board}
        choosePower={(e: number) => moves.subtractPowerOfTwo(board, e)}
        hovered={hoveredPower}
        hoverProps={hoverProps}
      />
    </GameBoard>
  );
}

const StepDescription = () => {
  const { t } = useTranslation('single-pile-removal');
  return t('takePowerOfTwo.step');
};

const Rule = () => {
  const { t } = useTranslation('single-pile-removal');
  return <Trans t={t} i18nKey="takePowerOfTwo.rule" />;
};

export const TakePowerOfTwo = strategyGameFactory({
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
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
