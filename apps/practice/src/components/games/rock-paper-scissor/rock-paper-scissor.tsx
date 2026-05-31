import { compact, cloneDeep } from 'lodash';
import { strategyGameFactory, type Ctx, type Events, type BoardClientProps, GameBoard } from '../../game-factory';
import { smartBotStrategy } from './bot-strategy';
import { RockSvg } from './symbols/rock-svg';
import { PaperSvg } from './symbols/paper-svg';
import { ScissorSvg } from './symbols/scissor-svg';
import { useTranslation } from '../../language';

export type Board = ('rock' | 'paper' | 'scissor' | null)[][]

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
      <span className="text-slate-500 text-xl text-center">{t({ hu: 'Kezdő', en: 'First' })}</span>
      <span></span>
      <span className="text-slate-500 text-xl text-center">{t({ hu: 'Második', en: 'Second' })}</span>
    </div>
    <div className="grid grid-cols-3">
      {[0, 1, 2].map(symbolIdx => (
        [0, null, 1].map(playerIdx => (
          playerIdx === null || board[playerIdx][symbolIdx] === null
          ? <span className="aspect-4/5 m-2" key={`${playerIdx}-${symbolIdx}`}></span>
          : <button
              key={`${playerIdx}-${symbolIdx}`}
              disabled={playerIdx === ctx.currentPlayer || !isMoveAllowed(symbolIdx)}
              onClick={() => clickField(symbolIdx)}
              className={`
                p-2 m-2 aspect-4/5 border-4 shadow-md
                enabled:border-green-400 enabled:border-dashed
                enabled:hocus:border-solid
              `}
            >
              { symbolIdx === 0 && (<RockSvg />) }
              { symbolIdx === 1 && (<PaperSvg />) }
              { symbolIdx === 2 && (<ScissorSvg />) }
            </button>
        ))
      ))}
    </div>
  </GameBoard>
  );
};

const isGameEnd = (board: Board) => {
  return compact(board[0]).length === 1 && compact(board[1]).length === 1;
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
    másik papírt, a harmadik ollót ábrázol. Ezután a játékosok felváltva elvesznek egy-egy kártyát az
    ellenfelük elől, egészen addig, amíg már csak egy-egy kártya marad. Ekkor a megmaradt kártyákat
    ütköztetik a „kő-papír-olló" játék szabályai szerint, így eldöntve, hogy ki a győztes; ha mindkét
    kártyán ugyanaz van, akkor a Kezdő nyert.
  </>,
  en: <>
    At the start each player has three cards in front of them: one showing rock, one paper, one
    scissors. Players take turns removing a card from their opponent until only one card remains
    for each player. The remaining cards are then compared by rock-paper-scissors rules to determine
    the winner; if both cards show the same symbol, the first player wins.
  </>
};

export const RockPaperScissor = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Távolíts el egy kártyát az ellenfél elől.',
      en: 'Remove a card from your opponent.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => [['rock', 'paper', 'scissor'], ['rock', 'paper', 'scissor']]
    }
  ]
});
