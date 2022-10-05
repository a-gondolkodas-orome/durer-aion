import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(state: State<MyGameState>, botID: string): [any[] | undefined, string] {
  console.log("asd")
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);
  if(state.G.answer === state.G.numberOfProblem*2){
    let tmp = (state.G.numberOfProblem+1).toString()
    return [[tmp+"+"+tmp+"?",3,true], "newProblem"]
  } else if(state.G.previousAnswers.length === 2){
    let tmp = (state.G.numberOfProblem+1).toString()
    return [[tmp+"+"+tmp+"?",3,false], "newProblem"]
  } else {
    return [[], "nextTry"];
  }
}