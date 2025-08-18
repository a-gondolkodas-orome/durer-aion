import { State } from 'boardgame.io';
import { GameStateMixin, GUESSER_PLAYER, JUDGE_PLAYER } from '../../common/types';
import { MyGameState } from './game';

const buvosbolRendes=[0,8,3,4,1,5,9,6,7,2];
const rendesbolBuvos=[0,4,9,2,3,5,7,8,1,6];

let megadottValaszlepesek = new Map<string,string>([
  ["", "1379"],
  ["1", "5"],
  ["12", "7"],
  ["13", "7"],
  ["14", "5"],
  ["15", "9"],
  ["159", "2468"],
  ["16", "7"],
  ["17", "3"],
  ["18", "3"],
  ["19", "7"],
  ["2", "5"],
  ["254", "3"],
  ["256", "1"],
  ["257", "6"],
  ["258", "79"],
  ["259", "4"],
  ["3", "5"],
  ["31", "9"],
  ["32", "5"],
  ["34", "9"],
  ["35", "7"],
  ["357", "2468"],
  ["36", "1"],
  ["37", "1"],
  ["38", "1"],
  ["39", "1"],
  ["4", "5"],
  ["452", "7"],
  ["453", "8"],
  ["456", "39"],
  ["458", "1"],
  ["459", "2"],
  ["5", "1379"],
  ["51289", "4"],
  ["51469", "2"],
  ["519", "73"],
  ["53287", "6"],
  ["53647", "2"],
  ["537", "19"],
  ["573", "91"],
  ["57463", "8"],
  ["57823", "4"],
  ["591", "37"],
  ["59641", "8"],
  ["59821", "6"],
  ["6", "5"],
  ["651", "8"],
  ["652", "9"],
  ["654", "17"],
  ["657", "2"],
  ["658", "3"],
  ["7", "5"],
  ["71", "9"],
  ["72", "9"],
  ["73", "9"],
  ["74", "9"],
  ["75", "3"],
  ["753", "2468"],
  ["76", "1"],
  ["78", "5"],
  ["79", "1"],
  ["8", "5"],
  ["851", "6"],
  ["852", "13"],
  ["853", "4"],
  ["854", "9"],
  ["856", "7"],
  ["9", "5"],
  ["91", "3"],
  ["92", "7"],
  ["93", "7"],
  ["94", "3"],
  ["95", "1"],
  ["951", "2468"],
  ["96", "5"],
  ["97", "3"],
  ["98", "3"],
]);
export function strategy(state: State<MyGameState & GameStateMixin>, botID: string): [number | undefined, string] {
  if (state.G.difficulty === "live") {
    let rEddigiek:number[] = [];
    if(state.G.firstPlayer === GUESSER_PLAYER){
      rEddigiek = state.G.playerNumbers.flatMap(
        (element, index) => [rendesbolBuvos[element], rendesbolBuvos[state.G.enemyNumbers[index]]]
      );
    }
    else if (state.G.firstPlayer === JUDGE_PLAYER){
      rEddigiek = state.G.enemyNumbers.flatMap(
        (element, index) => [rendesbolBuvos[element], rendesbolBuvos[state.G.playerNumbers[index]]]
      );
    }
    let rEddigiekString = rEddigiek.join("");
    if (rEddigiekString === "") { //kezdés
      switch (state.G.numberOfTries % 4) {
        case 0:
          return [buvosbolRendes[1], "clickCell"];
        case 1:
          return [buvosbolRendes[7], "clickCell"];
        case 2:
          return [buvosbolRendes[9], "clickCell"];
        case 3:
          return [buvosbolRendes[3], "clickCell"];
      }
    }
    if (megadottValaszlepesek.has(rEddigiekString)){ //megadott válasz
      let valasz=megadottValaszlepesek.get(rEddigiekString) as string;
      if (valasz.length>1){
        valasz=valasz[Math.floor(Math.random()*valasz.length)];
      }
      return [buvosbolRendes[parseInt(valasz)],"clickCell"];
    }
    const RSOROK=[[8,3,4],[1,5,9],[6,7,2],[8,1,6],[3,5,7],[4,9,2],[8,5,2],[4,5,6]];
    for (let i of RSOROK){ //nyerés
      if( state.G.enemyNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[2])){
        return [i[2], "clickCell"];
      }
      if( state.G.enemyNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[1])){
        return [i[1], "clickCell"];
      }
      if( state.G.enemyNumbers.includes(i[2]) && state.G.enemyNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[0])){
        return [i[0], "clickCell"];
      }
    }

    for (let i of RSOROK){ //blokkolás
      if( state.G.playerNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[2])){
        return [i[2], "clickCell"];
      }
      if( state.G.playerNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[1])){
        return [i[1], "clickCell"];
      }
      if( state.G.playerNumbers.includes(i[2]) && state.G.playerNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[0])){
        return [i[0], "clickCell"];
      }
    }

    const RVILLAK=[[8,3,4,1,6],[8,3,4,5,2],[8,1,6,5,2],[3,8,4,5,7],[4,8,3,5,6],[4,8,3,9,2],[4,5,6,9,2],[1,8,6,5,9],[5,8,2,3,7],[5,8,2,4,6],[5,8,2,1,9],[5,3,7,4,6],[5,3,7,1,9],[5,4,6,1,9],[9,1,5,4,2],[6,8,1,4,5],[6,8,1,7,2],[6,4,5,7,2],[7,3,5,6,2],[2,8,5,4,9],[2,8,5,6,7],[2,4,9,6,7]];

    for (let i of RVILLAK){ //villa
      if( state.G.remainingNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[1]) && state.G.playerNumbers.includes(i[3]) && state.G.remainingNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[4])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[1]) && state.G.playerNumbers.includes(i[4]) && state.G.remainingNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[3])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[2]) && state.G.playerNumbers.includes(i[3]) && state.G.remainingNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[4])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.playerNumbers.includes(i[2]) && state.G.playerNumbers.includes(i[4]) && state.G.remainingNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[3])){
        return [i[0], "clickCell"];
      }
    }

    for (let i of RVILLAK){ //villablokkolás
      if( state.G.remainingNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[1]) && state.G.enemyNumbers.includes(i[3]) && state.G.remainingNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[4])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[1]) && state.G.enemyNumbers.includes(i[4]) && state.G.remainingNumbers.includes(i[2]) && state.G.remainingNumbers.includes(i[3])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[2]) && state.G.enemyNumbers.includes(i[3]) && state.G.remainingNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[4])){
        return [i[0], "clickCell"];
      }
      if( state.G.remainingNumbers.includes(i[0]) && state.G.enemyNumbers.includes(i[2]) && state.G.enemyNumbers.includes(i[4]) && state.G.remainingNumbers.includes(i[1]) && state.G.remainingNumbers.includes(i[3])){
        return [i[0], "clickCell"];
      }
    }

    return [undefined, "clickCell"];

  }
  else {
    return [undefined, "clickCell"];
  }
}