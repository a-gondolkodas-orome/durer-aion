import React, { useState } from 'react';
import { random } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterAiTurn  } from './strategy/strategy';
import { GameBoard, getPlayerStepDescription } from './coin-3-piles';

const generateNewBoard = () => {
  const board = [random(0, 6), random(0, 6), random(0, 6)];
  if (board[1] !== 0 || board[2] !== 0) return board;
  return generateNewBoard();
};

const rule = <>
  Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.

  Az új játék gombra kattintva generálhatsz egy új kezdőállást. A kezdőállás ismeretében te döntheted el, hogy kezdeni
  szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '3, 2, 1 érmék',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const Coin123 = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
