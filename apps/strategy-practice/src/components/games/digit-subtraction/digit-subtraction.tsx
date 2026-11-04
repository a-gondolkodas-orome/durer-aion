import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { generateStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

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

const Rule = () => {
  const { t } = useTranslation('digit-subtraction');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('digit-subtraction');
  return t('step');
};

export const DigitSubtraction = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, generateStartBoard, label: fullVariantLabel, isDefault: true }
  ]
});
