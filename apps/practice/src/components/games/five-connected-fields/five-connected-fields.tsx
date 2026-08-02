import { strategyGameFactory, type Ctx } from "../../strategy-game-factory";
import { type Board, hasAnyMove, isNodePlayable } from "./helpers";
import { smartBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

export type { Board };

const moves = {
  placeCoin: {
    validate: (board: Board, _, node: number) => isNodePlayable(board, node),
    apply: (board: Board, { ctx }: { ctx: Ctx }, node: number) => {
      const nextBoard = board.slice();
      nextBoard[node] += 1;
      // The player who places the last coin wins: the game ends when no line has
      // equal endpoints, i.e. when the mover just made all further moves impossible.
      if (!hasAnyMove(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

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
      hu: "Kattints egy mezőre, amelynek van azonos számú koronggal rendelkező szomszédja, és tegyél rá egy korongot.",
      en: "Click a field that has a neighbour with the same number of coins to place a coin on it."
    })
  },
  BoardClient,
  gameplay: { moves },
  // smart bot: verified as optimal
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard: (): Board => [0, 0, 0, 0, 0] }]
});
