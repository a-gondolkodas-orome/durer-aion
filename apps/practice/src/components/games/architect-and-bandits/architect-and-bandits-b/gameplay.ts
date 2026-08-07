import { makeMoves, makeStartBoard } from '../gameplay';

export const VERTEX_COUNT = 10;

// The architect may walk this far along the wall each day.
export const KM_PER_DAY = 50;

export const generateStartBoard = makeStartBoard(VERTEX_COUNT);

export const moves = makeMoves(KM_PER_DAY);

export type { Moves } from '../gameplay';
