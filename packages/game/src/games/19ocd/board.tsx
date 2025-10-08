import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { range } from "lodash";


interface MyGameProps extends BoardProps<MyGameState> { }


export function MyBoard({ G, ctx, moves }: MyGameProps) {

  const onClick = (index: number) => {
    moves.removeNumber(index)
  };

  return (
    <svg width="100%" height="100%" viewBox='0 0 200 200'>
      {
        range(G.numbersOnTable.length).map(n => (
          <><rect
              key={`${n}rect`}
              x={(n%5)*40+5} y={Math.floor(n/5)*40+5} width={30} height={30} fill="white"
              stroke= {G.numbersOnTable[n] ? 
                              (G.previousMove%(n+1)===0 || (n+1)%G.previousMove===0)? "green" : "lightgreen"
                              : G.previousMove === n+1 ? "red" : "#ff9999"} 
              strokeWidth="1%" 
              onClick={() => onClick(n+1)} 
            /> 
          <text key={`${n}text`} x={(n%5)*40+20} y={Math.floor(n/5)*40+20} fontSize="100%" textAnchor="middle" dominantBaseline="middle" fill="black" onClick={() => onClick(n+1)}>{n+1}</text></>
        ))}
    </svg>
  )
}

