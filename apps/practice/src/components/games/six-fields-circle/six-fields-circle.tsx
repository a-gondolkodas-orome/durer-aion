import { strategyGameFactory, type Ctx, type Events } from "../../game-factory";
import { type Board, type Move, hasLegalMove, generateStartBoard } from "./helpers";
import { smartBotStrategy, randomBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

export type { Board };

const moves = {
  removeFromTwo: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }, [i, j]: Move) => {
    const nextBoard = board.slice();
    nextBoard[i] -= 1;
    nextBoard[j] -= 1;
    events.endTurn();
    // If no move remains, the next player cannot move and loses, so the player
    // who just moved (the current player) wins.
    if (!hasLegalMove(nextBoard)) events.endGame(ctx.currentPlayer);
    return { nextBoard };
  }
};

const getPlayerStepDescription = ({ ctx }: { ctx: Ctx }) => {
  if ((ctx.turnState as { first: number } | null) !== null) {
    return {
      hu: "Kattints egy másik, nem üres és a kijelölttel nem szemközti mezőre a második korong " +
        "elvételéhez, vagy a kijelölt mezőre a kijelölés visszavonásához.",
      en: "Click another non-empty field that is not opposite the selected one to take the second " +
        "disc, or click the selected field to undo the selection."
    };
  }
  return {
    hu: "Válassz ki egy nem üres mezőt, amelyről korongot szeretnél elvenni.",
    en: "Pick a non-empty field to take a disc from."
  };
};

const rule = {
  hu: <>
    Egy kör mentén elhelyezett 6 mezőn összesen legfeljebb 30, de páros sok korong van elosztva.
    Két játékos felváltva lép. Egy lépésben a soron következő játékos kiválaszt két szomszédos vagy
    másodszomszédos mezőt (vagyis bármely két nem szemközti mezőt), melyek egyike sem üres, és
    mindkettőről elvesz 1-1 korongot. Az a játékos veszít, aki nem tud lépni.
  </>,
  en: <>
    On 6 fields placed around a circle, an even number of discs (at most 30 in total) is distributed.
    Two players move alternately. On a turn the current player selects two neighbouring or
    second-neighbouring fields (that is, any two fields that are not opposite each other), neither of
    them empty, and removes one disc from each. The player who cannot move loses.
  </>
};

export const SixFieldsCircle = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: "Teszt", en: "Test" }
    },
    {
      // smart bot: verified as optimal (keeps every opposite-pair sum even)
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: "Teljes", en: "Full" },
      isDefault: true
    }
  ]
});
