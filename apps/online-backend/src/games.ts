import {
  GameRelay,
  MyGameWrappers as strategyGameWrappers,
  gameWrapper,
  strategyNames,
} from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import { RelayStrategy } from 'relay-bot';
import botWrapper from './botwrapper';
import { relayNames } from './server/common';

/** Each game the server hosts, beside the bot that plays it. One entry holds
 *  both, so a game added, dropped or reordered cannot end up with another
 *  game's bot. */
export const competitionGames = [
  { game: { ...GameRelay, name: relayNames.C }, bot: botWrapper(RelayStrategy("C")) },
  { game: { ...GameRelay, name: relayNames.D }, bot: botWrapper(RelayStrategy("D")) },
  { game: { ...GameRelay, name: relayNames.E }, bot: botWrapper(RelayStrategy("E")) },
  { game: { ...gameWrapper(strategyGameWrappers.C()), name: strategyNames.C }, bot: botWrapper(StrategyStrategy.C()) },
  { game: { ...gameWrapper(strategyGameWrappers.D()), name: strategyNames.D }, bot: botWrapper(StrategyStrategy.D()) },
  { game: { ...gameWrapper(strategyGameWrappers.E()), name: strategyNames.E }, bot: botWrapper(StrategyStrategy.E()) },
];
