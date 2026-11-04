import type { FC } from 'react';
import { strategyGameFactory, type BoardClientProps, type Ctx, GameBoard } from 'strategy-game-factory';
import { smartBotStrategy } from './bot-strategy';
import { RockSvg } from './symbols/rock-svg';
import { PaperSvg } from './symbols/paper-svg';
import { ScissorSvg } from '../shared/scissor-svg';
import { Trans, useTranslation } from 'react-i18next';
import { CARDS, startBoard, moves, type Board, type Card } from './gameplay';

const cardSvgs: Record<Card, FC> = {
  rock: RockSvg,
  paper: PaperSvg,
  scissor: ScissorSvg
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('rock-paper-scissor');

  return (
  <GameBoard>
    <div className="grid grid-cols-4 gap-y-3">
      <h2 className="text-center col-start-1">{t('board.first')}</h2>
      <h2 className="text-center col-start-4">{t('board.second')}</h2>

      {CARDS.map(card => {
        const CardSvg = cardSvgs[card];
        return [0, 1].map(playerIdx => (
          <button
            key={`${playerIdx}-${card}`}
            disabled={playerIdx === ctx.currentPlayer || !moves.removeCard.isAllowed(board, card)}
            onClick={() => moves.removeCard(board, card)}
            className={`
              ${playerIdx === 0 ? 'col-start-1' : 'col-start-4'}
              p-2 m-2 aspect-4/5 bg-surface-elevated rounded-lg drop-shadow-lg
              enabled:border-2 enabled:border-dashed
              enabled:hocus:opacity-50
              ${board[playerIdx].includes(card) ? '' : 'opacity-0'}
            `}
          >
            <CardSvg />
          </button>
        ));
      })}
    </div>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('rock-paper-scissor');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('rock-paper-scissor');
  return ctx.currentPlayer === 0 ? t('step.fromSecond') : t('step.fromFirst');
};

export const RockPaperScissor = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: smartBotStrategy, startBoards: [startBoard] }
  ]
});
