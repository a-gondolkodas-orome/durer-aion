import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, type Ctx } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { makeBoardClient } from '../board-client';
import { type Board } from '../gameplay';
import { startBoard, moves, MAX_TURN } from './gameplay';

const BoardClient = makeBoardClient(MAX_TURN);

const Rule = () => {
  const { t } = useTranslation('shark-chase');
  return <Trans t={t} i18nKey="rule.4x4" />;
};

const StepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  const { t } = useTranslation('shark-chase');
  if (ctx.currentPlayer === 0) return t('step.researcher');
  return board.sharkMovesInTurn === 0
    ? <Trans t={t} i18nKey="step.shark.twice" />
    : <Trans t={t} i18nKey="step.shark.once" />;
};

export const SharkChase4 = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [
      { hu: 'Kutató', en: 'Researcher' },
      { hu: 'Cápa', en: 'Shark' }
    ],
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
