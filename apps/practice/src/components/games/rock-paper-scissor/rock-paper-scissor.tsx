import { cloneDeep } from 'lodash';
import { strategyGameFactory, type Ctx, type Events, type BoardClientProps, GameBoard } from '../../game-factory';
import { smartBotStrategy } from './bot-strategy';
import { RockSvg } from './symbols/rock-svg';
import { PaperSvg } from './symbols/paper-svg';
import { ScissorSvg } from '../shared/scissor-svg';
import { useTranslation } from '../../language';

export type Board = ('rock' | 'paper' | 'scissor' | null)[][]

const symbolSvgs = [RockSvg, PaperSvg, ScissorSvg];

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const isMoveAllowed = (symbolIdx: number) => {
    if (!ctx.isClientMoveAllowed) return false;
    return board[1 - ctx.currentPlayer!][symbolIdx] !== null;
  };

  const clickField = (symbolIdx: number) => {
    if (!isMoveAllowed(symbolIdx)) return;

    moves.removeSymbol(board, symbolIdx)
  };

  return (
  <GameBoard>
    <div className="grid grid-cols-3">
      <h2 className="text-center col-start-1">{t({ hu: 'Kezdő', en: 'First' })}</h2>
      <h2 className="text-center col-start-3">{t({ hu: 'Második', en: 'Second' })}</h2>

      {[0, 1, 2].map(symbolIdx => {
        const SymbolSvg = symbolSvgs[symbolIdx];
        return [0, 1].map(playerIdx => (
          <button
            key={`${playerIdx}-${symbolIdx}`}
            disabled={playerIdx === ctx.currentPlayer || !isMoveAllowed(symbolIdx)}
            onClick={() => clickField(symbolIdx)}
            className={`
              ${playerIdx === 0 ? 'col-start-1' : 'col-start-3'}
              p-2 m-2 aspect-4/5 bg-surface-elevated rounded-lg drop-shadow-lg
              enabled:border-2 enabled:border-dashed
              enabled:hocus:opacity-50
              ${board[playerIdx][symbolIdx] === null ? 'opacity-0' : ''}
            `}
          >
            <SymbolSvg />
          </button>
        ));
      })}
    </div>
  </GameBoard>
  );
};

const isGameEnd = (board: Board) => {
  const remaining = (row: Board[number]) => row.filter(symbol => symbol !== null).length;
  return remaining(board[0]) === 1 && remaining(board[1]) === 1;
};

const getWinnerIndex = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  const pairs = [[0, 2], [1, 0], [2, 1]];
  for (const p of pairs) {
    if (board[0][p[0]] !== null && board[1][p[1]]) {
      return 0;
    }
  }
  return 1;
};

const moves = {
  removeSymbol: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, idx: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[1 - ctx.currentPlayer!][idx] = null;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame(getWinnerIndex(nextBoard));
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    A játék kezdetekor mindkét játékos elé leteszünk három kártyát: az egyik követ, a
    másik papírt, a harmadik ollót ábrázol. Ezután a játékosok felváltva elvesznek egy-egy kártyát a
    másik játékos elől, egészen addig, amíg már csak egy-egy kártya marad. Ekkor a megmaradt kártyákat
    ütköztetik a „kő-papír-olló" játék szabályai szerint, így eldöntve, hogy ki a győztes; ha mindkét
    kártyán ugyanaz van, akkor a Kezdő nyert.
  </>,
  en: <>
    At the start each player has three cards in front of them: one showing rock, one paper, one
    scissors. Players take turns removing a card from the other player until only one card remains
    for each player. The remaining cards are then compared by rock-paper-scissors rules to determine
    the winner; if both cards show the same symbol, the first player wins.
  </>
};

export const RockPaperScissor = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: ({ ctx }) => ({
      hu: `Távolíts el egy kártyát a másik (${ctx.currentPlayer === 0 ? 'Második' : 'Első'}) játékos elől.`,
      en: `Remove a card from the other (${ctx.currentPlayer === 0 ? 'Second' : 'First'}) player.`
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => [['rock', 'paper', 'scissor'], ['rock', 'paper', 'scissor']]
    }
  ]
});
