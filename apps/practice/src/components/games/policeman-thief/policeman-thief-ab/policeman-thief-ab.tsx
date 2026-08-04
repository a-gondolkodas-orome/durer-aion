import { range, random, sample, difference, cloneDeep } from "lodash";
import { strategyGameFactory, type Ctx, type MoveOutcome } from "../../../strategy-game-factory";
import { neighbours, isNeighbour, POLICE, THIEF } from "./helpers";
import { smartBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

export type Board = {
  turnCount: number
  policemen: number[]
  thief: number
  firstPolicemanMoved: boolean
}

const generateStartBoardA = (): Board => {
  const policeStartPosition = random(0, 7);
  const immediatePoliceWinPositions = [policeStartPosition, ...neighbours[policeStartPosition]];
  const thiefStartPosition = sample(difference(range(0, 8), immediatePoliceWinPositions));
  return {
    turnCount: 0,
    policemen: [policeStartPosition, policeStartPosition],
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

const generateStartBoardB = (): Board => {
  const policeStartPosition = [random(0, 7), random(0, 7)];
  const immediatePoliceWinPositions = [
    ...policeStartPosition,
    ...neighbours[policeStartPosition[0]],
    ...neighbours[policeStartPosition[1]]
  ];
  const thiefStartPositionOptions = difference(range(0, 8), immediatePoliceWinPositions);
  if (thiefStartPositionOptions.length === 0) {
    return generateStartBoardB();
  }
  const thiefStartPosition = sample(thiefStartPositionOptions);
  return {
    turnCount: 0,
    policemen: policeStartPosition,
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

// A police round is two half-moves — blue then green — and `firstPolicemanMoved`
// records which half is due, so no turn state is needed. The thief's move
// belongs to the other player entirely, hence the currentPlayer checks: they
// say *which* piece may move, not merely whose turn it is.
export const moves = {
  moveThief: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === THIEF && isNeighbour(board.thief, vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const overrides: Partial<Board> = { thief: vertex, turnCount: board.turnCount + 1 };
      const nextBoard = { ...cloneDeep(board), ...overrides };
      if (isGameEnd(nextBoard)) {
        return {
          nextBoard,
          gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? POLICE : THIEF }
        };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  moveFirstPoliceman: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === POLICE && !board.firstPolicemanMoved
        && isNeighbour(board.policemen[0], vertex),
    // First half of the police turn: both policemen move, one after the other.
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen[0] = vertex;
      nextBoard.firstPolicemanMoved = true;
      return { nextBoard };
    }
  },
  moveSecondPoliceman: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === POLICE && board.firstPolicemanMoved
        && isNeighbour(board.policemen[1], vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen[1] = vertex;
      nextBoard.firstPolicemanMoved = false;
      if (isGameEnd(nextBoard)) {
        return {
          nextBoard,
          gameEnd: { winnerIndex: hasFirstPlayerWon(nextBoard) ? POLICE : THIEF }
        };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const isGameEnd = (board: Board) => {
  if (board.turnCount === 3) {
    return true;
  } else if (board.thief === board.policemen[0] || board.thief === board.policemen[1]) {
    return true;
  }
  return false;
};

const hasFirstPlayerWon = (board: Board) => {
  return board.turnCount < 4 && board.policemen.includes(board.thief);
};

const ruleA = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket
    pöttyök jelölik. A játék kezdetén a számítógép az egyik útkereszteződésbe
    letesz egy tolvajt ábrázoló (piros) korongot, egy másikba pedig két
    rendőrt ábrázoló (kék illetve zöld) korongot. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd
    a tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet
    változtatnia. A rendőrök nyernek, ha a tolvaj
    bármikor azonos kereszteződésben van egy rendőrrel. A tolvaj nyer, ha a
    harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places a thief (red) piece at one intersection and two policemen (blue and green)
    at another. Each round the policemen move first (blue then green), each stepping to an adjacent
    intersection along a road (they may split up), then the thief moves the same way. Everyone must
    move every round. The policemen win if the thief is ever at the same intersection as a policeman.
    The thief wins if they are not caught by the end of the third round.
  </>
};

const ruleB = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket pöttyök
    jelölik. A játék kezdetén a számítógép valamely útkereszteződésekbe leteszi a tolvajt
    ábrázoló (piros), valamint a két rendőrt ábrázoló (kék illetve zöld) korongokat; a két rendőr
    esetleg ugyanarra a mezőre is kerülhet. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd a
    tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet változtatnia.
    A rendőrök nyernek, ha a tolvaj bármikor azonos kereszteződésben van egy rend-
    őrrel. A tolvaj nyer, ha a harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places the thief (red) and the two policemen (blue and green) at intersections of
    their choosing; the two policemen may start on the same intersection. Each round the policemen
    move first (blue then green), each stepping to an adjacent intersection along a road (they may
    split up), then the thief moves the same way. Everyone must move every round. The policemen win
    if the thief is ever at the same intersection as a policeman. The thief wins if they are not
    caught by the end of the third round.
  </>
}

const getPlayerStepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  if (ctx.currentPlayer === POLICE) {
    return {
      hu: `Kattints arra az útkereszteződésre, ahová a ` +
        `${board.firstPolicemanMoved ? "zöld" : "kék"} rendőrrel lépni szeretnél.`,
      en: `Click the intersection you want to move the ` +
        `${board.firstPolicemanMoved ? "green" : "blue"} policeman to.`
    };
  } else {
    return {
      hu: "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.",
      en: "Click the intersection you want to move the thief to."
    };
  }
}

const roleLabels: [{ hu: string; en: string }, { hu: string; en: string }] = [
  { hu: "Rendőrök", en: "Policemen" },
  { hu: "Tolvaj", en: "Thief" }
];

// A and B are the same game; they differ only in the start position (in A the two
// policemen always start on the same intersection, in B they may start apart) and
// the corresponding rule wording. Exposed as two variants of one game.
export const Policemanthief = strategyGameFactory({
  presentation: {
    rule: ruleA,
    roleLabels,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardA,
      label: { hu: 'Együtt (A)', en: 'Together (A)' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardB,
      rule: ruleB,
      label: { hu: 'Külön (B)', en: 'Apart (B)' }
    }
  ]
});
