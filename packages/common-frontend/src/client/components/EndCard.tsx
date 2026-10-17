import { Button, Dialog } from '@mui/material';
import { Stack } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { ScoreHeadline } from './ResultTables';

/**
 * The frame both end screens share: a title, the score out of its maximum,
 * the round's own results, an optional reminder and the way back.
 */
export function EndCard(props: {
  title: string,
  points: number,
  max: number,
  reminder?: string,
  backLabel: string,
  onBack: () => void,
  children: ReactNode,
}) {
  const theme = useTheme();
  return (
    <Stack sx={{
      width: "750px",
      maxWidth: "100%",
      boxSizing: 'border-box',
      marginTop: '10px',
      marginBottom: '10px',
      borderRadius: '30px',
      backgroundColor: theme.palette.background.paper,
      padding: { xs: '20px 12px', sm: '25px' },
      gap: '20px',
    }}>
      <Stack sx={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>
        {props.title}
      </Stack>
      <ScoreHeadline points={props.points} max={props.max}/>
      {props.children}
      {props.reminder && <Stack sx={{ fontSize: '15px', textAlign: 'center' }}>
        {props.reminder}
      </Stack>}
      <Button sx={{
        minWidth: '300px',
        height: '55px',
        fontSize: '22px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={props.onBack}>
        {props.backLabel}
      </Button>
    </Stack>
  );
}

/** The dialog an end screen opens in: edge to edge on a phone. */
export function EndDialog(props: { open: boolean, onClose: () => void, children: ReactNode }) {
  const theme = useTheme();
  return (
    <Dialog maxWidth={false} open={props.open} onClose={props.onClose} slotProps={{ paper: { sx: {
      marginX: { xs: 0, md: '32px' },
      maxWidth: { xs: '100%', md: 'calc(100% - 64px)' },
      backgroundColor: theme.palette.background.paper,
    } } }}>
      {props.children}
    </Dialog>
  );
}
