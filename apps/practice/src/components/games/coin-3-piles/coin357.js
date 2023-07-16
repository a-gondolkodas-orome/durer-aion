import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterAiTurn  } from './strategy/strategy';
import { GameBoard, getPlayerStepDescription } from './coin-3-piles';

const rule = <>
  Egy kupacban 3 darab 1, 5 darab 2 és 7 darab 3 pengős érme van. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.

  Te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '3 db 1, 5 db 2 és 7 db 3 pengős',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard: () => ([3, 5, 7]),
    getGameStateAfterAiTurn
  }
});

export const Coin357 = () => {
  const [board, setBoard] = useState([3, 5, 7]);

  return <Game board={board} setBoard={setBoard} />;
};
