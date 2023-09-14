import { State } from 'boardgame.io';
import { MyGameState } from './game';



export function strategyWrapper(category: "C" | "D" | "E")
{
  return (state: State<MyGameState>, botID: string): [number | {pile: number} | undefined, string] => {
    if(state.ctx.phase === "startNewGame") {
      return [startingPosition({G: state.G, ctx: state.ctx}, category), "setStartingPosition"];
    }
    
    if (state.G.pile%2 == 1) return [0, "changePile"];
    else if (state.G.pile/2 %2 == 0 && state.G.pile !== 4) return [0, "changePile"];
    else if (state.G.pile === 4) return [1, "changePile"];
    else return [Math.floor(Math.random() * 2), "changePile"];
  }
}

function startingPosition({ G, ctx}: any, category: "C" | "D" | "E"): {pile: number} {
  return {pile:17};
  /*if (category === "C"){
    // C Category
    if (G.difficulty === "test") {
      let numbers = [1,2,3,4];
      let rndNumber = Math.floor(Math.random()*2);
      for(let i = 0; i < rndNumber; i++){
        numbers.splice(Math.floor(Math.random()*numbers.length),1);
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
        numbers.splice(Math.floor(Math.random()*numbers.length),1);
      }
      return {coins: getRandomNumbers(numbers, 10-numbers.length)};
    }
    // D, E Category
    if (G.numberOfLoss < 2) {
      if (G.numberOfTries%2 === 1) {
        return {coins: getRandomNumbers([1,2,3,4,5], 5)};
      } else if (G.numberOfTries%2 === 0) {
        return {coins: getRandomNumbers([2,3,4,5], 6)};
      }
    } else if (G.numberOfLoss < 4) {
      if (G.numberOfTries%2 === 1) {
        return {coins: getRandomNumbers([1,3,4,5], 6)};
      } else if (G.numberOfTries%2 === 0) {
        return {coins: getRandomNumbers([1,2,3,5], 6)};
      }
    } else {
      if (G.numberOfTries%2 === 1) {
        return {coins: getRandomNumbers([1,4,5], 7)};
      } else if (G.numberOfTries%2 === 0) {
        return {coins: getRandomNumbers([3,4,5], 7)};
      }
    }
  }
  // just in case
  return {coins: [1,1,1,2,2,2,3,3,3,3]};*/
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