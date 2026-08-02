import { strategyGameFactory, type Ctx, type Events } from '../../strategy-game-factory';
import { BoardClient } from './board-client';
import {
  type Board,
  RED,
  applyMove,
  countColor,
  generateStartBoard,
  isDiscMoveAllowed,
  isPlacementAllowed,
  majorityWinner,
  targetCounts
} from './helpers';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const PLY_CAP = 200;

// Apply a resulting position: end the game if someone reached their majority or
// the 200-ply cap is hit (blue wins on the cap), otherwise pass the turn.
const finalize = (
  nextCells: Board['cells'],
  { ctx, events }: { ctx: Ctx; events: Events }
): { nextBoard: Board } => {
  const nextBoard: Board = { cells: nextCells };
  const winner = majorityWinner(nextCells);
  if (winner !== null) {
    events.endGame(winner);
  } else if (ctx.moveCount + 1 >= PLY_CAP) {
    events.endGame(1); // blue wins if neither side reaches their majority in time
  } else {
    events.endTurn();
  }
  return { nextBoard };
};

// Which discs a player may touch depends on their colour, so both validators
// read `ctx.currentPlayer`. Passing is always available, so it needs no
// validator.
const moves = {
  moveDisc: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, from: number, to: number) =>
      isDiscMoveAllowed(board.cells, ctx.currentPlayer!, from, to),
    legacyApply: (board: Board, meta: { ctx: Ctx; events: Events }, from: number, to: number) =>
      finalize(applyMove(board.cells, meta.ctx.currentPlayer!, { type: 'move', from, to }), meta)
  },
  placeDisc: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, at: number) =>
      isPlacementAllowed(board.cells, ctx.currentPlayer!, at),
    legacyApply: (board: Board, meta: { ctx: Ctx; events: Events }, at: number) =>
      finalize(applyMove(board.cells, meta.ctx.currentPlayer!, { type: 'place', to: at }), meta)
  },
  pass: (board: Board, meta: { ctx: Ctx; events: Events }) =>
    finalize([...board.cells], meta)
};

const rule = {
  hu: <>
    Egy sorban <i>n</i> mező van (itt legfeljebb 12); kezdetben a bal szélső mezőben egy piros, a jobb szélső
    mezőben egy kék korong áll. A kezdő játékos a pirossal, a másik a kékkel játszik. Egy lépésben a soron
    következő játékos háromféle lehetőség közül választ:
    <br />• Egy saját színű korongot egy vagy két mezővel odébb helyez egy üres mezőbe (ezzel akár át is
    ugorhat egy másik korongot).
    <br />• Lerak egy saját színű korongot egy olyan üres mezőbe, amely szomszédos egy olyan mezővel,
    amelyben saját korongja van.
    <br />• Passzol, azaz nem csinál semmit.
    <br /><br />Bármelyik lépés után, amikor egy üres mezőbe belekerül egy korong, az összes ezzel
    ellentétes színű korong, amely szomszédos mezőben van, átszíneződik erre a színre.
    <br /><br />Ha a játék során bármikor több, mint <i>n</i>/2 piros korong van a táblán, a piros játékos
    azonnal nyer; ha bármikor legalább <i>n</i>/2 kék korong van, akkor a kék játékos azonnal nyer. Ha 200
    lépésig egyik sem következik be, akkor a kék játékos nyer.
  </>,
  en: <>
    A row has <i>n</i> fields (at most 12 here); the leftmost field starts with a red disc and the rightmost
    with a blue disc. The first player plays red, the other plays blue. On a turn the player to move picks
    one of three options:
    <br />• Move one of their own discs one or two fields into an empty field (this may jump over another
    disc).
    <br />• Place a new disc of their own colour on an empty field adjacent to a field holding one of their
    discs.
    <br />• Pass, i.e. do nothing.
    <br /><br />After any move, when a disc enters an empty field, every disc of the opposite colour in an
    adjacent field is recoloured to that colour.
    <br /><br />If at any moment there are more than <i>n</i>/2 red discs on the board, red wins
    immediately; if at any moment there are at least <i>n</i>/2 blue discs, blue wins immediately. If
    neither happens within 200 moves, blue wins.
  </>
};

export const RecolouringDiscs = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: ({ board, ctx }) => {
      const goal = targetCounts(board.cells.length);
      const red = countColor(board.cells, 'red');
      const blue = countColor(board.cells, 'blue');
      const isRed = ctx.currentPlayer === RED;
      const who = ctx.isHumanVsHumanGame
        ? { hu: isRed ? 'A piros van soron.' : 'A kék van soron.', en: isRed ? 'Red to move.' : 'Blue to move.' }
        : { hu: isRed ? 'Te vagy a piros.' : 'Te vagy a kék.', en: isRed ? 'You are red.' : 'You are blue.' };
      const move = ctx.moveCount + 1; // the move about to be made
      return {
        hu: `${who.hu} Mozgass egy saját korongot 1–2 mezővel, tegyél le egy újat egy saját korong mellé, `
          + `vagy passzolj. Piros: ${red}/${goal.red}, kék: ${blue}/${goal.blue}. Lépés: ${move}/${PLY_CAP}.`,
        en: `${who.en} Move one of your discs by 1–2 fields, place a new one next to one of your discs, `
          + `or pass. Red: ${red}/${goal.red}, blue: ${blue}/${goal.blue}. Move ${move}/${PLY_CAP}.`
      };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified optimal in solver.spec.ts / bot-strategy.spec.ts
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
