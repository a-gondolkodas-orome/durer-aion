import { range } from 'lodash';
import { type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { Sheriff, Thief, type Board } from './gameplay';

// Both variants deal the same row of numbered cards and take one per click; the
// deck size is the only difference, and it is not on the board, so it comes in
// here. Called once at module scope by each game, so the component identity is
// stable across renders.
export const makeBoardClient = (cardCount: number) =>
  ({ board, ctx, moves }: BoardClientProps<Board>) => {
    const getCardColor = (num: number) => {
      if (board.cards[Thief].includes(num)) return 'bg-red-800';
      if (board.cards[Sheriff].includes(num)) return 'bg-blue-800 text-white';
      return 'bg-surface-elevated';
    };

    return (
      <GameBoard>
        <div>
          {range(1, cardCount + 1).map(num =>
          <button
            key={num}
            disabled={!moves.takeCard.isAllowed(board, num)}
            onClick={() => moves.takeCard(board, num)}
            className={`
              m-1 min-h-28 w-18 border-2 rounded-lg shadow-md border-slate-900 dark:border-slate-400 text-4xl font-bold
              ${ctx.currentPlayer === Thief
                ? 'enabled:hocus:bg-red-800/75'
                : 'enabled:hocus:bg-blue-800/75 enabled:hocus:text-white'
              }
              ${getCardColor(num)}
            `}
          >
            {num}
          </button>)}
        </div>
      </GameBoard>
    );
  };
