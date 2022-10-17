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

export function strategyWrapper(category: "C" | "D" | "E")
{
  return (state: State<MyGameState>, botID: string): [Array<number> | {coins: Array<number>} | undefined, string] => {
    if(state.ctx.phase === "startNewGame") {
      return [startingPosition({G: state.G, ctx: state.ctx}, category), "setStartingPosition"];
    }
    
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
}

function startingPosition({ G, ctx}: any, category: "C" | "D" | "E"): {coins: Array<number>} {
  if (category === "C"){
    // C Category
    if (G.difficulty === "test") {
      let numbers = [1,2,3,4];
      let rndNumber = Math.floor(Math.random()*2);
      for(let i = 0; i < rndNumber; i++){
        numbers.splice(Math.floor(Math.random()*numbers.length));
      }
      return {coins: getRandomNumbers(numbers, 10-numbers.length)};
    }
    if (G.numberOfTries === 1) {
      return {coins: [1,1,2,2,2,2,3,3,4,4]};
    } else if (G.numberOfTries === 2) {
      return {coins: [1,1,1,2,2,2,3,3,3,3]};
    } else if (G.numberOfTries%2 === 1) {
      let numbers = [1,2,3,4];
      if (G.numberOfTries%4 === 3) {
        numbers = [1,3,4];
      }
      return {coins: getRandomNumbers(numbers, 10-numbers.length)};
    } else {
      return {coins: getRandomNumbers([1,2,3], 7)};
    }
  } else if (category === "D" || 'E') {
    // D,E Category
    if (G.difficulty === "test") {
      let numbers = [1,2,3,4,5];
      let rndNumber = Math.floor(Math.random()*3);
      for(let i = 0; i < rndNumber; i++){
        numbers.splice(Math.floor(Math.random()*numbers.length));
      }
      return {coins: getRandomNumbers(numbers, 10-numbers.length)};
    }
    // D, E Category
    if (G.numberOfLoss < 2) {
      if (G.numberOfTries%2 == 1) {
        return {coins: getRandomNumbers([1,2,3,4,5], 5)};
      } else if (G.numberOfTries%2 == 0) {
        return {coins: getRandomNumbers([2,3,4,5], 6)};
      }
    } else if (G.numberOfLoss < 4) {
      if (G.numberOfTries%2 == 1) {
        return {coins: getRandomNumbers([1,3,4,5], 6)};
      } else if (G.numberOfTries%2 == 0) {
        return {coins: getRandomNumbers([1,2,3,5], 6)};
      }
    } else {
      if (G.numberOfTries%2 == 1) {
        return {coins: getRandomNumbers([1,4,5], 7)};
      } else if (G.numberOfTries%2 == 0) {
        return {coins: getRandomNumbers([3,4,5], 7)};
      }
    }
  }
  // just in case
  return {coins: [1,1,1,2,2,2,3,3,3,3]};
}

function getRandomNumbers(set: number[], count: number): number[] {
  let result = [];
  for (let i = 0; i < count; i++) {
    let randomIndex = Math.floor(Math.random() * set.length);
    result.push(set[randomIndex]);
  }
  result.push(...set);
  result.sort();
  return result;
}