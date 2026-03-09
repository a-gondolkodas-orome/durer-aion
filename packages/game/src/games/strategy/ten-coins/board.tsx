import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useRef} from 'react';
import Stack from '@mui/material/Stack';
import { Button } from '@mui/material';

import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps, theme: any) {
  // TODO: use formik
  // create refs to store the text input elements
  const inputK = useRef<HTMLInputElement>(null);
  const inputL = useRef<HTMLInputElement>(null);


  const onClick = () => {
    // read input value
    const inputValueK = parseInt(inputK.current!.value);
    const inputValueL = parseInt(inputL.current!.value);
    inputK.current!.value = '';
    inputL.current!.value = '';
    moves.changeCoins(inputValueK, inputValueL);
  };

  return (
    <Stack sx={{
      padding: '20px',
      display: 'flex',
    }}>
      <Stack sx={{
        width: '100%',
        flexDirection: 'row',
        marginBottom: '20px',
      }}>
        <Coin value={G.coins[0]} />
        <Coin value={G.coins[1]} />
        <Coin value={G.coins[2]} />
        <Coin value={G.coins[3]} />
        <Coin value={G.coins[4]} />
      </Stack>
      <Stack sx={{
        width: '100%',
        flexDirection: 'row',
        marginBottom: '20px',
      }}>
        <Coin value={G.coins[5]} />
        <Coin value={G.coins[6]} />
        <Coin value={G.coins[7]} />
        <Coin value={G.coins[8]} />
        <Coin value={G.coins[9]} />
      </Stack>
      <Stack sx={{
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Stack sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginRight: '10px',
          marginTop: '30px',
        }}>
          Következő lépés:
        </Stack>
        <Stack sx={{
          marginRight: '10px',
          width: '60px',
        }}>
          <label style={{
            fontSize: '18px',
            fontWeight: 'bold',
          }} htmlFor="stepK"> K: </label>
          <input style={{
            width: '100%',
            height: '40px',
            borderWidth: '2px',
            borderRadius: '5px',
            borderColor: theme.palette.primary.main,
            fontSize: '18px',
          }} ref={inputK} id="stepK" type="number" min="1" max="5" v-model="step" className="border-2" />
        </Stack>
        <KeyboardDoubleArrowRightIcon style={{
            fontSize: '2rem',
            marginTop: '24px',
          }}/>
        <Stack sx={{
          marginRight: '10px',
          width: '60px',
        }}>
          <label style={{
            fontSize: '18px',
            fontWeight: 'bold',
          }} htmlFor="stepK"> L: </label>
          <input style={{
            width: '100%',
            height: '40px',
            borderWidth: '2px',
            borderRadius: '5px',
            borderColor: theme.palette.primary.main,
            fontSize: '18px',
          }} ref={inputL} id="stepL" type="number" min="1" max="5" v-model="step" className="border-2" />
        </Stack>
        <Button sx={{
          width: '150px',
          height: '40px',
          fontSize: '16px',
          alignSelf: 'center',
          textTransform: 'none',
          borderRadius: '5px',
          marginTop: '30px',
        }} variant='contained' color='primary' disabled = {ctx.phase !== 'play'} onClick={() => {
          onClick();
        }}>
          Lépek
        </Button>
      </Stack>
    </Stack>
  )
}

const Coin = (props: { value: number }) => {
  let backgrondColor = '#FFFDCD';
  if (props.value > 1) {
    backgrondColor = '#FFE296'
  }
  if (props.value > 2) {
    backgrondColor = '#FF7D6B'
  }
  return (
    <Stack sx={{
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: backgrondColor,
      marginLeft: '5px',
      marginRight: '5px',
      fontSize: '40px',
      textAlign: 'center',
      lineHeight: '80px',
    }}>
      {props.value}
    </Stack>
  )
}