import { sample } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { POLICE, THIEF_MOVE_LIMIT, isCaught, neighbours, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// What the search works on. `firstPolicemanMoved` is not part of it: the bot
// names a whole police turn at once, so it only ever searches from a fresh one.
type Position = { policemen: [number, number], thief: number, turnCount: number }

// A police turn is where each policeman goes — one decision, nine ways to make it.
type PoliceTurn = [number, number]

const positionOf = (board: Board): Position => ({
  policemen: [board.policemen[0]!, board.policemen[1]!],
  thief: board.thief,
  turnCount: board.turnCount
});

const policeTurns = ({ policemen }: Position): PoliceTurn[] =>
  neighbours[policemen[0]].flatMap((first: number) =>
    neighbours[policemen[1]].map((second: number): PoliceTurn => [first, second]));

const afterPoliceTurn = (position: Position, [first, second]: PoliceTurn): Position =>
  ({ ...position, policemen: [first, second] });

const afterThiefMove = (position: Position, vertex: number): Position =>
  ({ ...position, thief: vertex, turnCount: position.turnCount + 1 });

// Three rounds of nine police turns against three thief replies is a few
// thousand positions, so the chase is solved outright rather than chased
// greedily. Both sides read their move off the same search.
const cache = new Map<string, boolean>();

// Do the police win, with a police turn due?
const policeWinMoving = (position: Position): boolean => {
  const { policemen, thief, turnCount } = position;
  const key = `${policemen[0]},${policemen[1]},${thief},${turnCount}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const result = policeTurns(position)
    .some(turn => policeWinAfterPoliceTurn(afterPoliceTurn(position, turn)));
  cache.set(key, result);
  return result;
};

// ... with the police turn just played, so the thief replies unless already caught.
// The thief may step onto a policeman — never willingly, but it keeps the reply
// list exactly the rules' one rather than a filtered version of it.
const policeWinAfterPoliceTurn = (position: Position): boolean =>
  isCaught(position)
    || neighbours[position.thief]
      .every((vertex: number) => policeWinAfterThiefMove(afterThiefMove(position, vertex)));

// ... with the thief's move just played: caught, out of moves, or play on.
const policeWinAfterThiefMove = (position: Position): boolean =>
  isCaught(position)
    || (position.turnCount < THIEF_MOVE_LIMIT && policeWinMoving(position));

// Whether the police, to move, catch the thief with best play from both sides.
export const policeWin = (board: Board): boolean => policeWinMoving(positionOf(board));

// From a lost position every move loses to best play, so play the one leaving
// the opponent fewest ways to keep the win — the best chance they pick wrong.
const fewestBy = <T,>(options: T[], cost: (option: T) => number): T[] => {
  const best = Math.min(...options.map(cost));
  return options.filter(option => cost(option) === best);
};

const policemenTurn = (board: Board): BotMove<Moves>[] => {
  const position = positionOf(board);
  const turns = policeTurns(position);
  const winning = turns.filter(
    turn => policeWinAfterPoliceTurn(afterPoliceTurn(position, turn))
  );
  const [first, second] = sample(winning.length ? winning : fewestBy(turns, turn => {
    const next = afterPoliceTurn(position, turn);
    return neighbours[next.thief]
      .filter((vertex: number) => !policeWinAfterThiefMove(afterThiefMove(next, vertex))).length;
  }))!;
  return [
    { move: 'moveFirstPoliceman', args: [first] },
    { move: 'moveSecondPoliceman', args: [second] }
  ];
};

const thiefMove = (board: Board): BotMove<Moves> => {
  const position = positionOf(board);
  const options: number[] = neighbours[position.thief];
  const escaping = options.filter(
    vertex => !policeWinAfterThiefMove(afterThiefMove(position, vertex))
  );
  const vertex = sample(escaping.length ? escaping : fewestBy(options, option => {
    const next = afterThiefMove(position, option);
    // Only two policemen chase three neighbours, so at least one step is never
    // straight into their arms — walking into one is always the worst option.
    if (isCaught(next)) return Infinity;
    return policeTurns(next)
      .filter(turn => policeWinAfterPoliceTurn(afterPoliceTurn(next, turn))).length;
  }))!;
  return { move: 'moveThief', args: [vertex] };
};

export const smartBotStrategy: Bot = ({ board, ctx }) =>
  ctx.currentPlayer === POLICE ? policemenTurn(board) : thiefMove(board);
