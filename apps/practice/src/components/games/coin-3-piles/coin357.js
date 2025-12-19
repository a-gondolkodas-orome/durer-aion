import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy  } from './bot-strategy';
import { BoardClient } from './board-client';
import { getPlayerStepDescription, moves } from './helpers';
import { gameList } from '../gameList';

const rule = <>
  Egy kupacban 3 darab 1, 5 darab 2 és 7 darab 3 pengős érme van. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.
</>;

export const Coin357 = strategyGameFactory({
  rule,
  metadata: gameList.Coin357,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard: () => ([3, 5, 7]),
  aiBotStrategy,
  moves
});
