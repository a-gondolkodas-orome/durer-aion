import { useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import {
  generateArbitraryStartBoard, startBoardOfCategoryA, generateTestStartBoard, moves,
  type TurnState
} from './gameplay';

const StepDescription = ({ turnState }: { turnState: TurnState | null }) => {
  const { t } = useTranslation('coins-in-3-piles');
  return turnState !== null ? t('step.placeBack') : t('step.take');
};

const Rule = ({ fixed = false }: { fixed?: boolean }) => {
  const { t } = useTranslation('coins-in-3-piles');
  return fixed ? t('rule.fixed') : t('rule.any');
};

export const CoinsIn3Piles = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: ({ ctx: { turnState } }) => <StepDescription turnState={turnState} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      id: 'test',
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: testVariantLabel
    },
    {
      id: '3-5-7',
      botStrategy: smartBotStrategy,
      startBoards: [startBoardOfCategoryA],
      rule: <Rule fixed />,
      label: t => t('coins-in-3-piles:variant.fixed')
    },
    {
      id: 'random',
      botStrategy: smartBotStrategy,
      generateStartBoard: generateArbitraryStartBoard,
      label: t => t('coins-in-3-piles:variant.random'),
      isDefault: true
    }
  ]
});
