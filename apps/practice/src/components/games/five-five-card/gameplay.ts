import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export const CARDS = [1, 2, 3, 4, 5] as const;

export type Card = typeof CARDS[number]

// The cards each player still holds, in `CARDS` order.
export type Board = [Card[], Card[]]

export const generateStartBoard = (): Board => [[...CARDS], [...CARDS]];

// The board taking `card` leaves behind. A move takes from the *other* hand, so
// `player` is the mover; the bot's look-ahead plays the same function forward.
export const withCardTaken = (board: Board, player: number, card: Card): Board => {
  const nextBoard: Board = [...board];
  nextBoard[1 - player] = board[1 - player].filter(held => held !== card);
  return nextBoard;
};

export const isGameEnd = (board: Board) => board.every(hand => hand.length === 1);

// Reached only on an ended board, so each hand's first card is its survivor.
export const getWinnerIndex = (board: Board) => {
  const [first] = board[0];
  const [second] = board[1];
  if (first === second) return 0;

  const larger = first > second ? 0 : 1;
  // An odd sum goes to the larger card, an even sum to the smaller.
  return (first + second) % 2 === 1 ? larger : 1 - larger;
};

export const moves = {
  removeCard: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, card: Card) =>
      board[1 - ctx.currentPlayer!].includes(card),
    apply: (board: Board, { ctx }: { ctx: Ctx }, card: Card): MoveOutcome<Board> => {
      const nextBoard = withCardTaken(board, ctx.currentPlayer!, card);
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: getWinnerIndex(nextBoard) } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
