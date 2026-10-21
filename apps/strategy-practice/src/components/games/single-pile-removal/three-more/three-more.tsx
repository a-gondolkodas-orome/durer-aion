import { Trans, useTranslation } from 'react-i18next';
import { strategyGameFactory } from 'strategy-game-factory';
import { BoardClient, getPlayerStepDescription } from '../pebble-pile';
import {  } from '../gameplay';
import { generateStartBoard, moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';

const Rule = () => {
  const { t } = useTranslation('single-pile-removal');
  return <Trans t={t} i18nKey="threeMore.rule" />;
};

export const ThreeMore = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard }]
});
