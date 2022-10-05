import { State } from 'boardgame.io';
import { MyGameState } from './game';

const strategyMap = new Map<Array<boolean>, undefined | Array<number>>([
  [[true,true,false,false,false], [2,1]],
  [[true,false,true,false,false], [3,1]],
  [[true,false,false,true,false], [4,1]],
  [[true,false,false,false,true], [5,1]],
  [[false,true,true,false,false], [3,2]],
  [[false,true,false,true,false], [4,2]],
  [[false,true,false,false,true], [5,2]],
  [[false,false,true,true,false], [4,3]],
  [[false,false,true,false,true], [5,3]],
  [[false,false,false,true,true], [5,4]],

  [[true,true,true,false,false], undefined],
  [[true,true,false,true,false], [4,3]],
  [[true,true,false,false,true], [5,3]],
  [[true,false,true,true,false], [4,2]],
  [[true,false,true,false,true], [5,2]],
  [[true,false,false,true,true], undefined],
  [[false,true,true,true,false], [4,1]],
  [[false,true,true,false,true], [5,1]],
  [[false,true,false,true,true], [2,1]],
  [[false,false,true,true,true], [3,1]],

  [[true,true,true,true,false], [4,2]],
  [[true,true,true,false,true], [5,3]],
  [[true,true,false,true,true], [2,1]],
  [[true,false,true,true,true], [3,1]],
  [[false,true,true,true,true], undefined],

  [[true,true,true,true,true], undefined]
]);

export function strategy(state: State<MyGameState>, botID: string): [Array<number> | undefined, string] {
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);

  let existingCoins = [false,false,false,false,false];
    for(let i = 0; i < 10; i++){
      existingCoins[state.G.coins[i]] = true;
    }
  return [strategyMap.get(existingCoins), "changeCoins"];
}