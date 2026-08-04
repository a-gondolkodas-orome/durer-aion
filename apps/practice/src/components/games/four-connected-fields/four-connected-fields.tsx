import { strategyGameFactory, type Ctx, type MoveOutcome } from "../../strategy-game-factory";
import { type Board, hasAnyMove, isNodePlayable } from "./helpers";
import { randomBotStrategy, smartBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

export type { Board };

export const moves = {
  placeCoin: {
    validate: (board: Board, _, node: number) => isNodePlayable(board, node),
    apply: (board: Board, { ctx }: { ctx: Ctx }, node: number): MoveOutcome<Board> => {
      const nextBoard = board.slice();
      nextBoard[node] += 1;
      // No move remains once every field is occupied and no line has equal
      // endpoints.
      if (!hasAnyMove(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const rule = {
  hu: <>
    Az ábrán négy mező látható, melyeket vonalak kötnek össze. Kezdetben mind a
    négy mező üres. Egy lépésben a soron lévő játékos vagy választ egy üres mezőt,
    és rak rá egy korongot, vagy kiválaszt egy vonalat, melynek a két végpontján
    ugyanannyi korong van, és az egyik végpontjára rak még egy korongot. A játék
    akkor ér véget, ha nincs üres mező és nincs olyan vonal, aminek a két végén
    ugyanannyi korong van. Az a játékos nyer, aki az utolsó korongot lerakta.
  </>,
  en: <>
    The diagram shows four fields joined by lines. Every field starts empty. On a
    turn the current player either picks an empty field and places a coin on it,
    or picks a line whose two endpoints hold the same number of coins and places
    one more coin on one of those endpoints. The game ends when no field is empty
    and no line has an equal number of coins at both ends. The player who placed
    the last coin wins.
  </>
};

export const FourConnectedFields = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: "Kattints egy üres mezőre, vagy egy olyanra, amelynek van azonos számú koronggal " +
        "rendelkező szomszédja, és tegyél rá egy korongot.",
      en: "Click an empty field, or a field with a neighbour holding the same number of coins, to place a coin on it."
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: "Teszt", en: "Test" }
    },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => [0, 0, 0, 0],
      label: { hu: "Teljes", en: "Full" },
      isDefault: true
    }
  ]
});
