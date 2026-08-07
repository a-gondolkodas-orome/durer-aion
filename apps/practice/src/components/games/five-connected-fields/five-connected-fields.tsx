import { strategyGameFactory } from 'strategy-game-factory';
import { generateStartBoard, moves } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const rule = {
  hu: <>
    Az ábrán öt mező látható, melyeket vonalak kötnek össze. Kezdetben mind az öt
    mező üres. Egy lépésben a soron lévő játékos kiválaszt egy vonalat, melynek a
    két végpontján lévő mezőben ugyanannyi korong van, és az egyik végpontjára rak
    még egy korongot. A játék akkor ér véget, ha nincs olyan vonal, aminek a két
    végén ugyanannyi korong van. Az a játékos nyer, aki az utolsó korongot lerakta.
  </>,
  en: <>
    The diagram shows five fields joined by lines. Every field starts empty. On a
    turn the current player picks a line whose two endpoints hold the same number
    of coins, and places one more coin on one of those endpoints. The game ends
    when no line has an equal number of coins at both ends. The player who placed
    the last coin wins.
  </>
};

export const FiveConnectedFields = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy mezőre, amelynek van azonos számú koronggal rendelkező szomszédja, és tegyél rá egy korongot.',
      en: 'Click a field that has a neighbour with the same number of coins to place a coin on it.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard }]
});
