import { strategyGameFactory, type Ctx, type Events } from '../../game-factory';
import {
  type Board, generateEmptyBoard, playerColor, playerHasLine, isBoardFull
} from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

export type { Board };

const moves = {
  placePiece: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }, node: number) => {
    const nextBoard = board.slice();
    nextBoard[node] = playerColor(ctx.currentPlayer!);
    events.endTurn();
    if (playerHasLine(nextBoard, ctx.currentPlayer!)) {
      // Three of your discs adjacent in a line: the player who placed them wins.
      events.endGame(ctx.currentPlayer);
    } else if (isBoardFull(nextBoard)) {
      // Board full with no line: the second player wins.
      events.endGame(1);
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Adott az ábrán látható módosított malom pálya. A két játékos felváltva helyez le piros
    és kék korongokat a táblára. (Olyan mezőre nem rakhattok korongot, ahol már van valamilyen
    színű korong.) Az a játékos nyer, akinek először összegyűlik három egy vonalban lévő
    szomszédos korongja. Ha már minden mezőn szerepel korong, de egyik színű korongból sincs
    három szomszédos, melyek egy vonalban helyezkednek el, akkor a második játékos nyer.
  </>,
  en: <>
    The board is the modified mill board shown in the figure. The two players take turns placing
    red and blue discs on the board. (You may not place a disc on a cell that already holds a disc
    of either colour.) The player who first gets three of their own discs adjacent in a line wins.
    If every cell holds a disc but neither colour has three adjacent discs in a line, then the
    second player wins.
  </>
};

export const ModifiedMill = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy üres mezőre, hogy lerakj rá egy korongot.',
      en: 'Click an empty cell to place a disc on it.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // First player follows the exhaustively verified winning strategy; as the
      // second player (the losing side) it plays best-effort and may not always
      // punish a mistake — hence notAlwaysOptimal.
      botStrategy: smartBotStrategy,
      generateStartBoard: generateEmptyBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true,
      notAlwaysOptimal: true
    }
  ]
});
