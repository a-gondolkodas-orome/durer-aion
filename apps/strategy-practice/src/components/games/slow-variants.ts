// Shared by the two all-games sweeps (plays-to-an-end, json-round-trip), so
// one list decides which variants are too slow to play a match of in a sweep.
//
// A variant is listed here only because its bot searches deeply enough to
// dominate the suite's runtime — several cost seconds, and swing by more than
// 10x with the random start board they get. A game's rules are shared by all
// its variants, so a cheap variant covers the same moves, validators and win
// detection; what is lost is the coverage of that bot, which its own spec has.
// Two games have no cheap variant left and so drop out of the sweep entirely:
// AmorAndCupido (a single, searching variant) and TriangularGridRopes15 (both
// variants search). Both have a bot-strategy spec of their own.
export const SLOW_VARIANTS = new Set([
  'AmorAndCupido[0]',
  'Bacteria[2]',
  'ChessBishops[1]',
  'ChessDucks[1]',
  'ChessDucks[2]',
  'FiveSquares[1]',
  'RecolouringDiscs[1]',
  'SharkChase5[1]',
  'TriangleCircleGame[1]',
  'TriangularGridRopes[1]',
  'TriangularGridRopes15[0]',
  'TriangularGridRopes15[1]'
]);
