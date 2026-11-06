import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory, testVariantLabel, fullVariantLabel } from 'strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import {  } from '../gameplay';
import { generateStartBoard, generateTestStartBoard, moves } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('single-pile-removal');
  return <Trans t={t} i18nKey="waningStones.rule" />;
};

export const WaningStones = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription
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
      generateStartBoard,
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
