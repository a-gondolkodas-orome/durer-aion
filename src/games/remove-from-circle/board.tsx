import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { sendDataStrategyStep } from '../../common/sendData';
import { range } from "lodash";
import { IS_OFFLINE_MODE } from '../../client/utils/util';


interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {

  const onClick = (index: number) => {
    if(IS_OFFLINE_MODE){
      sendDataStrategyStep(null, index, G, ctx);
    }
    moves.removePoint(index)
  };

  const getAngle = (index: number) => {
    let step = Math.PI*2/G.circle.length;
    return index*step + (G.firstMove === -1 ? 0 : G.firstMove*step)
  };

  return (
    <svg width="100%" height="100%" viewBox='0 0 200 200'>
      {
        range(G.circle.length).map(index => (
          <line
          key={`${index-1}-${index}`}
          x1={55+50*Math.cos(getAngle(index))} y1={55+50*Math.sin(getAngle(index))}
          x2={55+50*Math.cos(getAngle(index-1))} y2={55+50*Math.sin(getAngle(index-1))}
          stroke = {(G.circle.at(index-1) && G.circle.at(index)) ? "green" : "red"}
          strokeWidth={2}
          />
        ))}
      {/*
        range(G.circle.length).map(index => (
          <circle 
            key={index}
            cx={55+50*Math.cos(getAngle(index))} cy={55+50*Math.sin(getAngle(index))}
            r="2%" fill={G.circle[index] && (G.circle.at(index-1) || G.circle[(index+1)%G.circle.length]) ? "green" : "red"}
            onClick={() => onClick(index)}
          /> 
        ))*/}
        {
    range(G.circle.length).map(index => (
      <circle 
        key={index}
        cx={55+50*Math.cos(getAngle(index))} cy={55+50*Math.sin(getAngle(index))}
        r="2%"
        fill={index === G.lastMove ? "white" : (G.circle[index] && (G.circle.at(index-1) || G.circle[(index+1)%G.circle.length]) ? "green" : "red")}
        stroke={index === G.lastMove ? "red" : "none"}
        strokeWidth={index === G.lastMove ? "1%" : "0"}
        onClick={() => onClick(index)}
      /> 
    ))
  }
    </svg>
  )
}

