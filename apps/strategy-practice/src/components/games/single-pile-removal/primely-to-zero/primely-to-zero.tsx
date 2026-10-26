import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { range } from 'lodash';
import { generateStartBoard, maxStart, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  return (
    <GameBoard>
      <div className="flex flex-wrap gap-2">
        {range(maxStart + 1).map(i =>
          <button
            key={i}
            disabled={!moves.moveTo.isAllowed(board, i)}
            onClick={() => moves.moveTo(board, i)}
            className={`
              border-2 rounded-sm text-2xl min-w-[4ch] p-1 my-1 font-bold
              enabled:bg-green-200 dark:enabled:bg-green-700 enabled:hocus:bg-green-400 dark:enabled:hocus:bg-green-600
              ${i === 0 ? 'border-slate-900 dark:border-slate-400 border-dashed' : ''}
              ${i > board ? 'opacity-50' : ''}
            `}
          >
            {i === board ? 'X' : i}
          </button>
        )}
      </div>
    </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('single-pile-removal');
  return <Trans t={t} i18nKey="primelyToZero.rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('single-pile-removal');
  return t('primelyToZero.step');
};

export const PrimelyToZero = strategyGameFactory({
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
