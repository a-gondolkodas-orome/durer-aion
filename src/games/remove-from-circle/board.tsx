import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import Stack from '@mui/material/Stack';
import { Button } from '@mui/material';
import { sendDataStrategyStep } from '../../common/sendData';
import { range } from "lodash";


interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {

  const onClick = (index: number) => {
    if(process.env.REACT_APP_WHICH_VERSION === "b"){
      sendDataStrategyStep(null, index, G, ctx);
    }
    moves.removePoint(index)
  };

  

  return (<>
    <svg>
      {
        range(G.circle.length).map(index => (
          <line
          key={`${index-1}-${index}`}
          x1={55+50*Math.cos(index*Math.PI*2/G.circle.length)} y1={55+50*Math.sin(index*Math.PI*2/G.circle.length)}
          x2={55+50*Math.cos((index-1)*Math.PI*2/G.circle.length)} y2={55+50*Math.sin((index-1)*Math.PI*2/G.circle.length)}
          stroke = {(G.circle.at(index-1) && G.circle.at(index)) ? "black" : "gray"}
          strokeWidth={4}
          />
        ))}
      {
        range(G.circle.length).map(index => (
          <circle 
            key={index}
            cx={55+50*Math.cos(index*Math.PI*2/G.circle.length)} cy={55+50*Math.sin(index*Math.PI*2/G.circle.length)}
            r="2%" fill={G.circle[index] && (G.circle.at(index-1) || G.circle[(index+1)%G.circle.length]) ? "black" : "gray"}
            onClick={() => onClick(index)}
          /> 
        ))}
    </svg>
    </>
  )
}

