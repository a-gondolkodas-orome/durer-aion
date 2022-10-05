import { State } from 'boardgame.io';
import { MyGameState } from './game';

const strategyMap = new Map<string, undefined | Array<number>>([
  ["11000", [2,1]],
  ["10100", [3,1]],
  ["10010", [4,1]],
  ["10001", [5,1]],
  ["01100", [3,2]],
  ["01010", [4,2]],
  ["01001", [5,2]],
  ["00110", [4,3]],
  ["00101", [5,3]],
  ["00011", [5,4]],

  ["11100", undefined],
  ["11010", [4,3]],
  ["11001", [5,3]],
  ["10110", [4,2]],
  ["10101", [5,2]],
  ["10011", undefined],
  ["01110", [4,1]],
  ["01101", [5,1]],
  ["01011", [2,1]],
  ["00111", [3,1]],

  ["11110", [4,2]],
  ["11101", [5,3]],
  ["11011", [2,1]],
  ["10111", [3,1]],
  ["01111", undefined],

  ["11111", undefined]
]);

export function strategy(state: State<MyGameState>, botID: string): [Array<number> | undefined, string] {
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);

  let existingCoins = [false,false,false,false,false];
  for(let i = 0; i < 10; i++){
    existingCoins[state.G.coins[i] - 1] = true;
  }
  let coinsString = "";
  for(let i = 0; i < 5; i++){
    if(existingCoins[i]) coinsString += '1';
    else coinsString += '0';
  }
  return [strategyMap.get(coinsString), "changeCoins"];
}