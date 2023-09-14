import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useRef} from 'react';
import Stack from '@mui/material/Stack';
import { Button } from '@mui/material';
import theme from '../../client/components/theme';
import { useTeamState } from '../../client/hooks/user-hooks';
import { sendDataStrategyStep } from '../../common/sendData';

import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  // TODO: use formik
  // create refs to store the text input elements

  const teamState = useTeamState();

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

