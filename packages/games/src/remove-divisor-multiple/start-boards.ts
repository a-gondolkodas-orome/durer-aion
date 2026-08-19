import type { Board } from './gameplay';

const numbersUpTo = (n: number): Board => ({
  numbersOnTable: Array(n).fill(true),
  previousMove: null
});

// The XIX. online round's live boards, in hand-out order: entry 0 opens an
// attempt, entry 1 follows the first win of a streak. The two boards of each
// category are winnable by opposite roles on purpose — a team must re-choose
// its role mid-streak, so knowing the winning strategy includes knowing whose
// it is (start-boards.spec.ts pins each winner). The order is part of the
// contract: append, never reorder (durer-jatekok#314).
export const competitionStartBoardsC: Board[] = [numbersUpTo(6), numbersUpTo(7)];
export const competitionStartBoardsD: Board[] = [numbersUpTo(10), numbersUpTo(11)];
