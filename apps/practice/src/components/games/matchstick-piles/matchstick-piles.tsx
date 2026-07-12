import { Fragment, useState } from 'react';
import { range, sample, random } from 'lodash';
import {
  strategyGameFactory,
  type Events, type StrategyArgs, type GameMoves, type BoardClientProps,
  GameBoard
} from '../../game-factory';

// A board is the list of pile sizes; every pile has at least one match.
export type Board = number[];

type Hover =
  | { pileId: number; kind: 'remove'; moveCount: number }
  | { pileId: number; kind: 'split'; splitAfter: number; moveCount: number }
  | null;

const Matchstick = ({ removed }: { removed: boolean }) => (
  <span className="relative block w-2 h-9">
    <span className={`
      absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full
      ${removed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-red-600'}
    `} />
    <span className={`
      absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm
      ${removed ? 'bg-amber-200/40 dark:bg-amber-200/20' : 'bg-amber-300 dark:bg-amber-400'}
    `} />
  </span>
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [hover, setHover] = useState<Hover>(null);
  const activeHover =
    ctx.isClientMoveAllowed && hover?.moveCount === ctx.moveCount ? hover : null;

  const clickRemove = (pileId: number) => {
    if (!ctx.isClientMoveAllowed) return;
    moves.removeMatch(board, pileId);
  };

  const clickSplit = (pileId: number, splitAfter: number) => {
    if (!ctx.isClientMoveAllowed) return;
    moves.splitPile(board, pileId, splitAfter + 1);
  };

  const hoverSplit = (pileId: number, splitAfter: number) =>
    setHover({ pileId, kind: 'split', splitAfter, moveCount: ctx.moveCount });
  const hoverRemove = (pileId: number) =>
    setHover({ pileId, kind: 'remove', moveCount: ctx.moveCount });
  const clearHover = () => setHover(null);

  const pileDescription = (pileId: number, size: number) => {
    if (!activeHover || activeHover.pileId !== pileId) return `${size}`;
    if (activeHover.kind === 'remove') return `${size} → ${size - 1}`;
    const first = activeHover.splitAfter + 1;
    return `${size} → ${first}, ${size - first}`;
  };

  const isMatchRemoved = (pileId: number, matchId: number, size: number) =>
    activeHover?.kind === 'remove'
    && activeHover.pileId === pileId
    && matchId === size - 1;

  const isSplitActive = (pileId: number, splitAfter: number) =>
    activeHover?.kind === 'split'
    && activeHover.pileId === pileId
    && activeHover.splitAfter === splitAfter;

  return (
    <GameBoard>
      <div className="flex flex-wrap justify-center items-start gap-3 p-2">
        {board.map((size, pileId) => (
          <div
            key={pileId}
            className={`
              bg-surface-elevated rounded-md text-center px-2 pt-1 pb-2
              border border-slate-300 dark:border-slate-600
            `}
          >
            <p className="text-lg font-semibold mb-1 tabular-nums">
              {pileDescription(pileId, size)}
            </p>
            <div className="flex items-end justify-center">
              {range(size).map(matchId => (
                <Fragment key={matchId}>
                  {matchId > 0 && (
                    <button
                      type="button"
                      aria-label="split pile here"
                      disabled={!ctx.isClientMoveAllowed}
                      className="self-stretch w-4 flex items-center justify-center group"
                      onClick={() => clickSplit(pileId, matchId - 1)}
                      onFocus={() => hoverSplit(pileId, matchId - 1)}
                      onBlur={clearHover}
                      onPointerEnter={() => hoverSplit(pileId, matchId - 1)}
                      onPointerLeave={clearHover}
                    >
                      <span className={`
                        w-0.5 h-9 rounded-full transition-colors
                        ${isSplitActive(pileId, matchId - 1)
                          ? 'bg-blue-600'
                          : 'bg-transparent group-enabled:group-hover:bg-blue-300'}
                      `} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="remove a match from this pile"
                    disabled={!ctx.isClientMoveAllowed}
                    className={`
                      p-1 rounded-sm
                      enabled:hover:bg-slate-200 dark:enabled:hover:bg-slate-700
                      enabled:focus:bg-slate-200 dark:enabled:focus:bg-slate-700
                    `}
                    onClick={() => clickRemove(pileId)}
                    onFocus={() => hoverRemove(pileId)}
                    onBlur={clearHover}
                    onPointerEnter={() => hoverRemove(pileId)}
                    onPointerLeave={clearHover}
                  >
                    <Matchstick removed={isMatchRemoved(pileId, matchId, size)} />
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameBoard>
  );
};

const moves = {
  removeMatch: (board: Board, { events }: { events: Events }, pileId: number) => {
    const nextBoard = board
      .map((n, i) => (i === pileId ? n - 1 : n))
      .filter(n => n > 0);
    events.endTurn();
    // The player who takes the last match leaves the other player unable to
    // move, and therefore wins.
    if (nextBoard.length === 0) events.endGame();
    return { nextBoard };
  },
  splitPile: (board: Board, _meta: { events: Events }, pileId: number, firstPart: number) => {
    const size = board[pileId];
    const nextBoard = board.flatMap((n, i) =>
      i === pileId ? [firstPart, size - firstPart] : [n]
    );
    _meta.events.endTurn();
    return { nextBoard };
  }
};

// --- Optimal strategy -------------------------------------------------------
// Impartial game: the Grundy value of a single pile of size n is
//   g(0)=0, g(1)=1, g(2)=2, and for n>=3: 2 if n is even, 0 if n is odd.
// The value of a position is the XOR of its piles; the player to move wins iff
// that XOR is non-zero. A winning move is any move leaving the opponent an
// all-zero XOR position.
const grundy = (n: number): number => {
  if (n <= 2) return n;
  return n % 2 === 0 ? 2 : 0;
};

const xorSum = (board: Board): number => board.reduce((acc, n) => acc ^ grundy(n), 0);

type Move =
  | { type: 'remove'; pileId: number }
  | { type: 'split'; pileId: number; firstPart: number };

const legalMoves = (board: Board): Move[] => {
  const result: Move[] = [];
  board.forEach((size, pileId) => {
    result.push({ type: 'remove', pileId });
    for (let firstPart = 1; firstPart < size; firstPart++) {
      result.push({ type: 'split', pileId, firstPart });
    }
  });
  return result;
};

const applyMove = (board: Board, move: Move): Board => {
  if (move.type === 'remove') {
    return board.map((n, i) => (i === move.pileId ? n - 1 : n)).filter(n => n > 0);
  }
  const size = board[move.pileId];
  return board.flatMap((n, i) =>
    i === move.pileId ? [move.firstPart, size - move.firstPart] : [n]
  );
};

const executeMove = (board: Board, moves: GameMoves<Board>, move: Move) => {
  if (move.type === 'remove') {
    moves.removeMatch(board, move.pileId);
  } else {
    moves.splitPile(board, move.pileId, move.firstPart);
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const candidates = legalMoves(board);
  const winningMove = candidates.find(move => xorSum(applyMove(board, move)) === 0);
  // In a losing position no move wins against optimal play, so play a random
  // legal move and hope the opponent slips.
  const move = winningMove ?? sample(candidates)!;
  executeMove(board, moves, move);
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const candidates = legalMoves(board);
  // Grab an immediately winning move (one that empties the board) if there is
  // one; otherwise just play a random legal move.
  const winningNow = candidates.find(move => applyMove(board, move).length === 0);
  const move = winningNow ?? sample(candidates)!;
  executeMove(board, moves, move);
};

const generateStartBoard = (): Board => range(random(2, 3)).map(() => random(2, 6));

const rule = {
  hu: <>
    A pályán néhány kupac gyufaszál található. Felváltva lépünk, kétféle lépés
    megengedett: vagy egyetlen gyufát elveszünk valamelyik kupacból, vagy egy
    kupacot felosztunk két kisebb kupacra. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are several piles of matchsticks on the board. Players take turns; two
    kinds of move are allowed: either remove a single match from one of the
    piles, or split a pile into two smaller piles. The player who cannot move
    loses.
  </>
};

export const MatchstickPiles = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Vegyél el egy gyufát egy kupacból, vagy vágj ketté egy kupacot a rések valamelyikénél.',
      en: 'Take a match from a pile, or split a pile in two at one of the gaps.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: () => range(random(2, 3)).map(() => random(2, 5)),
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // smart bot: verified as optimal (Grundy/XOR characterisation)
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
