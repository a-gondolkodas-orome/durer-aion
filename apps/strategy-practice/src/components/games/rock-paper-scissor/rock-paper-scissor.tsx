import type { FC } from 'react';
import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { smartBotStrategy } from './bot-strategy';
import { RockSvg } from './symbols/rock-svg';
import { PaperSvg } from './symbols/paper-svg';
import { ScissorSvg } from '../shared/scissor-svg';
import { useTranslation } from 'language';
import { CARDS, startBoard, moves, type Board, type Card } from './gameplay';

const cardSvgs: Record<Card, FC> = {
  rock: RockSvg,
  paper: PaperSvg,
  scissor: ScissorSvg
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();

  return (
  <GameBoard>
    <div className="grid grid-cols-4 gap-y-3">
      <h2 className="text-center col-start-1">{t({ hu: 'Kezdő', en: 'First' })}</h2>
      <h2 className="text-center col-start-4">{t({ hu: 'Második', en: 'Second' })}</h2>

      {CARDS.map(card => {
        const CardSvg = cardSvgs[card];
        return [0, 1].map(playerIdx => (
          <button
            key={`${playerIdx}-${card}`}
            disabled={playerIdx === ctx.currentPlayer || !moves.removeCard.isAllowed(board, card)}
            onClick={() => moves.removeCard(board, card)}
            className={`
              ${playerIdx === 0 ? 'col-start-1' : 'col-start-4'}
              p-2 m-2 aspect-4/5 bg-surface-elevated rounded-lg drop-shadow-lg
              enabled:border-2 enabled:border-dashed
              enabled:hocus:opacity-50
              ${board[playerIdx].includes(card) ? '' : 'opacity-0'}
            `}
          >
            <CardSvg />
          </button>
        ));
      })}
    </div>
  </GameBoard>
  );
};

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
    { botStrategy: smartBotStrategy, startBoards: [startBoard] }
  ]
});
