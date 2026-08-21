import { makeMoves, makeStartBoard, type Board } from '../gameplay';

export const VERTEX_COUNT = 8;

// The architect may walk this far along the wall each day.
export const KM_PER_DAY = 40;

export const startBoard: Board = makeStartBoard(VERTEX_COUNT);

export const moves = makeMoves(KM_PER_DAY);

export type { Moves } from '../gameplay';
