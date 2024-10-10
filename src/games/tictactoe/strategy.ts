import { State } from 'boardgame.io';
import { MyGameState } from './game';

const THREE_IN_A_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
// checks if the player can win
function checkRow(cells: (string | null)[], cell1: number, cell2: number, cell3: number, playerID: string): null | number {
  const c1 = cells[cell1];
  const c2 = cells[cell2];
  const c3 = cells[cell3];
  if (c1 === playerID && c2 === playerID && c3 === null) return cell3;
  if (c1 === playerID && c3 === playerID && c2 === null) return cell2;
  if (c2 === playerID && c3 === playerID && c1 === null) return cell1;
  return null;
}

export function strategy(state: State<MyGameState>, botID: string): [number | undefined, string] {
  if(state.ctx.phase === "startNewGame") {
    return [0, "setStartingPosition"];
  }
  const cells = state.G.cells;
  // check if player can win
  for (const row of THREE_IN_A_ROWS) {
    const result = checkRow(cells, row[0], row[1], row[2], botID);
    if (result !== null) {
      console.debug("I've found it!");
      return [result, "clickCell"];
    }
  }
  // check if enemy could win
  for (const row of THREE_IN_A_ROWS) {
    const result = checkRow(cells, row[0], row[1], row[2], botID === '0' ? '1' : '0');
    if (result !== null) {
      console.debug("I won't let you!");
      return [result, "clickCell"];
    }
  }
  // Fall-through: no return -> choose random move
  return [undefined, "clickCell"];
}