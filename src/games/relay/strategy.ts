import { State } from 'boardgame.io';
import { MyGameState } from './game';

const problems ={
  C: [
    {
      problemText: "1+1?",
      answer: 2,
    },
    {
      problemText: "2+2?",
      answer: 4,
    },
    {
      problemText: "3+3?",
      answer: 6,
    },
    {
      problemText: "4+4?",
      answer: 8,
    },
    {
      problemText: "5+5?",
      answer: 10,
    },
    {
      problemText: "6+6?",
      answer: 12,
    },
    {
      problemText: "7+7?",
      answer: 14,
    },
    {
      problemText: "8+8?",
      answer: 16,
    },
    {
      problemText: "9+9?",
      answer: 18,
    },
  ],
  D: [
    {
      problemText: "1+1?",
      answer: 2,
    },
    {
      problemText: "2+2?",
      answer: 4,
    },
    {
      problemText: "3+3?",
      answer: 6,
    },
    {
      problemText: "4+4?",
      answer: 8,
    },
    {
      problemText: "5+5?",
      answer: 10,
    },
    {
      problemText: "6+6?",
      answer: 12,
    },
    {
      problemText: "7+7?",
      answer: 14,
    },
    {
      problemText: "8+8?",
      answer: 16,
    },
    {
      problemText: "9+9?",
      answer: 18,
    },
  ],
  E: [
    {
      problemText: "1+1?",
      answer: 2,
    },
    {
      problemText: "2+2?",
      answer: 4,
    },
    {
      problemText: "3+3?",
      answer: 6,
    },
    {
      problemText: "4+4?",
      answer: 8,
    },
    {
      problemText: "5+5?",
      answer: 10,
    },
    {
      problemText: "6+6?",
      answer: 12,
    },
    {
      problemText: "7+7?",
      answer: 14,
    },
    {
      problemText: "8+8?",
      answer: 16,
    },
    {
      problemText: "9+9?",
      answer: 18,
    },
  ],
}

export function strategy(category: "C" | "D" | "E"){
  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    if (state.G.numberOfTry === 0) {
      return [[problems[category][state.G.currentProblem].problemText,3,false], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[category][state.G.currentProblem].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }
    
    // Next problem if there is one and the time is not over
    if (state.G.currentProblem < 8) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
      return [[problems[category][state.G.currentProblem+1].problemText,3,correctnessPreviousAnswer], "newProblem"];
    }
    // End of the game
    return [[], "endGame"];
  }
}