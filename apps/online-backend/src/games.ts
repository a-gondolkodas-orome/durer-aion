import {
  GameRelay,
  MyGameWrappers as strategyGameWrappers,
  gameWrapper,
  strategyGameOfCategory,
  strategyNames,
} from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import { RelayStrategy } from 'relay-bot';
import botWrapper from './botwrapper';
import { relayNames } from './server/common';

const { C: gameC, D: gameD, E: gameE } = strategyGameOfCategory;

/** Each game the server hosts, beside the bot that plays it. One entry holds
 *  both, so a game added, dropped or reordered cannot end up with another
 *  game's bot. */
export const competitionGames = [
  { game: { ...GameRelay, name: relayNames.C }, bot: botWrapper(RelayStrategy("C")) },
  { game: { ...GameRelay, name: relayNames.D }, bot: botWrapper(RelayStrategy("D")) },
  { game: { ...GameRelay, name: relayNames.E }, bot: botWrapper(RelayStrategy("E")) },
  { game: { ...gameWrapper(strategyGameWrappers[gameC]()), name: strategyNames[gameC] }, bot: botWrapper(StrategyStrategy[gameC]()) },
  { game: { ...gameWrapper(strategyGameWrappers[gameD]()), name: strategyNames[gameD] }, bot: botWrapper(StrategyStrategy[gameD]()) },
  { game: { ...gameWrapper(strategyGameWrappers[gameE]()), name: strategyNames[gameE] }, bot: botWrapper(StrategyStrategy[gameE]()) },
];
