import { range } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, type BoardClientProps, GameBoard, testVariantLabel, fullVariantLabel
} from 'strategy-game-factory';
import { generateEmptyBoard, moves, type Board } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => (
  <GameBoard>
    <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-600 gap-1 p-1">
      {range(9).map(id => (
        <button
          key={id}
          disabled={!moves.placeStone.isAllowed(board, id)}
          onClick={() => moves.placeStone(board, id)}
          className="aspect-square p-[25%] bg-surface-elevated"
        >
          {board[id] && (
            <span className="w-full aspect-square block rounded-full bg-slate-800 dark:bg-slate-200"></span>
          )}
      </button>
      ))}
    </div>
  </GameBoard>
);

const Rule = () => {
  const { t } = useTranslation('magic-box');
  return <Trans t={t} i18nKey="rule.a" />;
};

const StepDescription = () => {
  const { t } = useTranslation('magic-box');
  return t('step.a');
};

export const MagicBox = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyBoard()],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
