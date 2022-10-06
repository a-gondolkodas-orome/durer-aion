import { State } from 'boardgame.io';
import { MyGameState } from './game';

export function strategy(state: State<MyGameState>, botID: string): [any[] | undefined, string] {
  console.log("asd")
  //let possible_moves = this.enumerate(state.G, state.ctx, playerID);
  //let randomIndex = Math.floor(Math.random() * possible_moves.length);
  if(state.G.answer === (state.G.currentProblem+1)*2){
    let tmp = (state.G.currentProblem+2).toString();
    return [[tmp+"+"+tmp+"?",3,true, state.G.answer], "newProblem"];
  } else if(state.G.numberOfTry === 3){
    let tmp = (state.G.currentProblem+2).toString();
    return [[tmp+"+"+tmp+"?",3,false, state.G.answer], "newProblem"];
  } else {
    return [[state.G.currentProblemMaxPoints-1, state.G.answer], "nextTry"];
  }
}