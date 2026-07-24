import { cloneDeep, random } from "lodash";
import { strategyGameFactory, type Ctx, type Events } from "../../../strategy-game-factory";
import { smartBotStrategy, randomBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

export type Phase = 'placingCops' | 'placingThief' | 'chasing';

export type Board = {
  copCount: number
  phase: Phase
  policemen: number[]   // grows during placingCops; length === copCount afterwards
  thief: number | null  // null until placed
  thiefMoveCount: number // completed thief moves; thief wins on reaching 3
  copCursor: number     // index of the cop that moves next in a chasing cop-turn
};

// Most games use 2 policemen — the tight, genuinely hard case. A small share
// deal out 3 instead, where the police win much more easily.
const THREE_COP_PERCENT = 20;

export const pickCopCount = (): number => (random(1, 100) <= THREE_COP_PERCENT ? 3 : 2);

export const generateStartBoard = (): Board => ({
  copCount: pickCopCount(),
  phase: 'placingCops',
  policemen: [],
  thief: null,
  thiefMoveCount: 0,
  copCursor: 0
});

export const moves = {
  // Police placement: one click per policeman; police may share a vertex.
  placeCop: (board: Board, { events }: { events: Events }, vertex: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard.policemen.push(vertex);
    if (nextBoard.policemen.length === nextBoard.copCount) {
      nextBoard.phase = 'placingThief';
      events.endTurn();
    }
    return { nextBoard };
  },
  // Thief picks a starting vertex (guaranteed police-free by the board client).
  placeThief: (board: Board, { events }: { events: Events }, vertex: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard.thief = vertex;
    nextBoard.phase = 'chasing';
    nextBoard.copCursor = 0;
    events.endTurn();
    return { nextBoard };
  },
  // Chasing: move the current policeman along one edge. Catching the thief
  // (landing on its vertex) ends the game immediately for the police.
  moveCop: (board: Board, { events }: { events: Events }, vertex: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard.policemen[nextBoard.copCursor] = vertex;
    nextBoard.copCursor += 1;
    if (vertex === nextBoard.thief) {
      events.endGame(0);
      return { nextBoard };
    }
    if (nextBoard.copCursor === nextBoard.copCount) {
      nextBoard.copCursor = 0;
      events.endTurn();
    }
    return { nextBoard };
  },
  // Chasing: move the thief along one edge. Stepping onto a policeman loses;
  // completing a third move without being caught wins.
  moveThief: (board: Board, { events }: { events: Events }, vertex: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard.thief = vertex;
    nextBoard.thiefMoveCount += 1;
    if (nextBoard.policemen.includes(vertex)) {
      events.endGame(0);
      return { nextBoard };
    }
    if (nextBoard.thiefMoveCount === 3) {
      events.endGame(1);
      return { nextBoard };
    }
    events.endTurn();
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    A gráfon egy tolvaj menekül néhány rendőr elől. Előbb a rendőrök foglalják el
    a pozíciójukat tetszőleges csúcsokon (akár többen ugyanazon), majd a tolvaj
    választ egy rendőrmentes kiinduló csúcsot. Ezután körökre osztva előbb az
    összes rendőr, végül a tolvaj lép egy-egy él mentén. Minden körben mindenkinek
    kötelező helyet változtatnia. A rendőrök nyernek, ha a tolvaj bármikor egy
    rendőrrel azonos csúcsra kerül. A tolvaj nyer, ha három lépést meg tud tenni
    anélkül, hogy elkapnák. A rendőrök száma a játék elején kiderül.
  </>,
  en: <>
    On this graph a thief flees from a group of policemen. First the policemen
    take up their positions on any vertices (several may share one), then the
    thief picks a starting vertex not occupied by a policeman. After that, in each
    round all the policemen move first, then the thief moves, each along a single
    edge. Everyone must change position every round. The policemen win if the
    thief is ever on the same vertex as a policeman. The thief wins if they can
    make three moves without being caught. The number of policemen is revealed at
    the start.
  </>
};

const copColorName = { hu: ['kék', 'zöld', 'sárga'], en: ['blue', 'green', 'amber'] };

const getPlayerStepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  if (board.phase === 'placingCops') {
    const n = board.policemen.length + 1;
    return {
      hu: `Helyezd el a(z) ${n}. rendőrt (${copColorName.hu[n - 1]}) egy tetszőleges csúcsra.`,
      en: `Place policeman ${n} (${copColorName.en[n - 1]}) on any vertex.`
    };
  }
  if (board.phase === 'placingThief') {
    return {
      hu: "Válaszd ki a tolvaj kiinduló csúcsát (nem lehet rendőrös csúcs).",
      en: "Choose the thief's starting vertex (it cannot be a vertex with a policeman)."
    };
  }
  // chasing
  if (ctx.currentPlayer === 0) {
    return {
      hu: `Lépj a ${copColorName.hu[board.copCursor]} rendőrrel egy szomszédos csúcsra.`,
      en: `Move the ${copColorName.en[board.copCursor]} policeman to a neighbouring vertex.`
    };
  }
  const remaining = 3 - board.thiefMoveCount;
  return {
    hu: `Lépj a tolvajjal egy szomszédos csúcsra. Még ${remaining} lépés a győzelemig.`,
    en: `Move the thief to a neighbouring vertex. ${remaining} more move(s) to win.`
  };
};

export const PolicemanthiefC = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: "Rendőrök", en: "Policemen" },
      { hu: "Tolvaj", en: "Thief" }
    ],
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      // Random bot: plays a random legal move, but grabs an immediate catch/escape
      // when one is available. Lets a human thief realistically win.
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // Smart bot: provably optimal (full minimax on the fixed graph).
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
