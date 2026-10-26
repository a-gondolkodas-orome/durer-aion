import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { CARDS, startBoard, moves, type Board } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('five-five-card');

  return (
  <GameBoard>
    <div className="grid grid-cols-4 gap-y-3">
      <h2 className="text-center col-start-1">
        {t('board.first')}
      </h2>
      <h2 className="text-center col-start-4">
        {t('board.second')}
      </h2>

      {CARDS.map(card => (
        [0, 1].map(playerIdx => (
          <button
            key={`${playerIdx}-${card}`}
            disabled={playerIdx === ctx.currentPlayer || !moves.removeCard.isAllowed(board, card)}
            onClick={() => moves.removeCard(board, card)}
            className={`
              ${playerIdx === 0 ? 'col-start-1' : 'col-start-4'}
              aspect-3/2 text-2xl border-4 rounded-lg
              enabled:border-green-400 enabled:border-dashed
              enabled:hocus:border-solid
              ${board[playerIdx].includes(card) ? '' : 'opacity-0'}
            `}
          >
            {card}
          </button>
        ))
      ))}
    </div>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('five-five-card');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('five-five-card');
  return t('step');
};

export const FiveFiveCard = strategyGameFactory({
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
      startBoards: [startBoard],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
