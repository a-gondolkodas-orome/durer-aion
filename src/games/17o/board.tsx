import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import Stack from '@mui/material/Stack';
import { Button } from '@mui/material';


interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  // TODO: use formik
  // create refs to store the text input elements


  const onClick1 = () => {
    
    moves.changePile(0)
  };
  const onClick2 = () => {
    
    moves.changePile(1);
    
  };

  return (
    <Stack sx={{
      padding: '20px',
      display: 'flex',
    }}>
      {G.pile}
      <Button sx={{
          width: '150px',
          height: '40px',
          fontSize: '16px',
          alignSelf: 'center',
          textTransform: 'none',
          borderRadius: '5px',
          marginTop: '30px',
        }} variant='contained' color='primary' disabled = {ctx.phase !== 'play' } onClick={() => {
          onClick1();
        }}>
          -1
        </Button>
        <Button sx={{
          width: '150px',
          height: '40px',
          fontSize: '16px',
          alignSelf: 'center',
          textTransform: 'none',
          borderRadius: '5px',
          marginTop: '30px',
        }} variant='contained' color='primary' disabled = {ctx.phase !== 'play' || G.pile%2 !== 0} onClick={() => {
          onClick2();
        }}>
          /2
        </Button>
    </Stack>
  )
}

