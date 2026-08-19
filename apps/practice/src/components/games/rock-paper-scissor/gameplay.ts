import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export const CARDS = ['rock', 'paper', 'scissor'] as const;

export type Card = typeof CARDS[number]

// The cards each player still holds, in `CARDS` order.
export type Board = [Card[], Card[]]

export const startBoard: Board = [[...CARDS], [...CARDS]];

const BEATS: Record<Card, Card> = { rock: 'scissor', paper: 'rock', scissor: 'paper' };

export const beats = (a: Card, b: Card) => BEATS[a] === b;

const isGameEnd = (board: Board) => board.every(hand => hand.length === 1);

export const moves = {
  removeCard: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, card: Card) =>
      board[1 - ctx.currentPlayer!].includes(card),
    apply: (board: Board, { ctx }: { ctx: Ctx }, card: Card): MoveOutcome<Board> => {
      const opponent = 1 - ctx.currentPlayer!;
      const nextBoard: Board = [...board];
      nextBoard[opponent] = board[opponent].filter(held => held !== card);
      if (isGameEnd(nextBoard)) {
        // Each hand is down to its survivor. Two cards showing the same symbol go
        // to the starting player, so the second player only takes the round by
        // beating them outright.
        return {
          nextBoard,
          gameEnd: { winnerIndex: beats(nextBoard[1][0], nextBoard[0][0]) ? 1 : 0 }
        };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
