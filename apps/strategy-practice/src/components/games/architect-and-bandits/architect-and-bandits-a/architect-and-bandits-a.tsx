import { useTranslation } from 'react-i18next';
import { strategyGameFactory, type Ctx } from 'strategy-game-factory';
import { ARCHITECT, type Board } from '../gameplay';
import { makeBoardClient } from '../board-client';
import { smartBotStrategy } from './bot-strategy';
import { startBoard, moves, KM_PER_DAY } from './gameplay';

const BoardClient = makeBoardClient(KM_PER_DAY);

// Vertices A(0)..H(7) clockwise, each edge 10 km, max 40 km/day

const Rule = () => {
  const { t } = useTranslation('architect-and-bandits');
  return t('rule.a');
};

const StepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  const { t } = useTranslation('architect-and-bandits');
  if (ctx.currentPlayer === ARCHITECT) {
    const movesLeft = (40 - board.kmUsedToday) / 10;
    if (movesLeft === 0) return t('step.endDay', { day: board.day });
    return t('step.architect', { day: board.day, movesLeft });
  }
  return t('step.bandits', { day: board.day });
};

export const ArchitectAndBandits = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [t => t('architect-and-bandits:role.architect'), t => t('architect-and-bandits:role.bandits')],
    getPlayerStepDescription: ({ board, ctx }) => <StepDescription board={board} ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves, endOfTurnMove: 'startNextDay' },
  variants: [{
    botStrategy: smartBotStrategy,
    startBoards: [startBoard]
  }]
});
