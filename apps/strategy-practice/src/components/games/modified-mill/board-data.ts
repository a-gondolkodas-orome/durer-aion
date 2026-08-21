/* eslint-disable max-len */
// AUTO-GENERATED — do not edit by hand (compact single-line data literals).
// 24-node board: three concentric squares whose CORNERS are joined across
// squares by the four corner diagonals. Edge-midpoints connect only to their
// own square's corners (there are no radial spokes between squares).
// Node indices, win-lines and the 8 dihedral (D4) symmetry permutations must
// stay in exact sync with the precomputed strategy table.

export const COORDS: [number, number][] = [[0, 0], [6, 0], [6, 6], [0, 6], [3, 0], [6, 3], [3, 6], [0, 3], [1, 1], [5, 1], [5, 5], [1, 5], [3, 1], [5, 3], [3, 5], [1, 3], [2, 2], [4, 2], [4, 4], [2, 4], [3, 2], [4, 3], [3, 4], [2, 3]];

// Each entry is a set of 3 collinear, mutually adjacent nodes: completing one
// with a single colour wins. 12 square sides + 4 corner diagonals.
export const LINES: [number, number, number][] = [[0, 4, 1], [1, 5, 2], [2, 6, 3], [3, 7, 0], [8, 12, 9], [9, 13, 10], [10, 14, 11], [11, 15, 8], [16, 20, 17], [17, 21, 18], [18, 22, 19], [19, 23, 16], [0, 8, 16], [1, 9, 17], [2, 10, 18], [3, 11, 19]];

// The 8 symmetries of the board (dihedral group of the square), each a
// permutation of the 24 node indices. Used to canonicalise positions.
export const SYMMETRIES: number[][] = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], [1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12, 17, 18, 19, 16, 21, 22, 23, 20], [2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13, 18, 19, 16, 17, 22, 23, 20, 21], [3, 0, 1, 2, 7, 4, 5, 6, 11, 8, 9, 10, 15, 12, 13, 14, 19, 16, 17, 18, 23, 20, 21, 22], [1, 0, 3, 2, 4, 7, 6, 5, 9, 8, 11, 10, 12, 15, 14, 13, 17, 16, 19, 18, 20, 23, 22, 21], [3, 2, 1, 0, 6, 5, 4, 7, 11, 10, 9, 8, 14, 13, 12, 15, 19, 18, 17, 16, 22, 21, 20, 23], [0, 3, 2, 1, 7, 6, 5, 4, 8, 11, 10, 9, 15, 14, 13, 12, 16, 19, 18, 17, 23, 22, 21, 20], [2, 1, 0, 3, 5, 4, 7, 6, 10, 9, 8, 11, 13, 12, 15, 14, 18, 17, 16, 19, 21, 20, 23, 22]];
