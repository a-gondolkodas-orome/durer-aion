import { Button, Dialog, IconButton } from '@mui/material';
import { Stack } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreHeadline } from './ResultTables';

/**
 * The frame both end screens share: a title, the score out of its maximum,
 * the round's own results, an optional reminder and the way back. With
 * `onClose` it can also be closed onto the round's page, from its corner or
 * from a button under the way back that says where closing leads.
 */
export function EndCard(props: {
  title: string,
  points: number,
  max: number,
  reminder?: string,
  backLabel: string,
  onBack: () => void,
  onClose?: { label: string, onClick: () => void },
  children: ReactNode,
}) {
  const { t } = useTranslation();
  return (
    <Stack sx={{
      position: 'relative',
      width: "750px",
      maxWidth: "100%",
      boxSizing: 'border-box',
      marginTop: '10px',
      marginBottom: '10px',
      padding: { xs: '20px 12px', sm: '25px' },
      gap: '20px',
    }}>
      {props.onClose && <IconButton aria-label={t('general.close')} onClick={props.onClose.onClick}
        sx={{ position: 'absolute', top: '8px', right: '8px' }}>
        <CloseIcon />
      </IconButton>}
      <Stack sx={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', paddingX: props.onClose ? '40px' : 0 }}>
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
      {props.onClose && <Button variant='text' color='primary' startIcon={<VisibilityOutlinedIcon />}
        onClick={props.onClose.onClick}
        sx={{ alignSelf: 'center', minHeight: '44px', marginTop: '-10px', fontSize: '16px', fontWeight: 600, textTransform: 'none' }}>
        {props.onClose.label}
      </Button>}
    </Stack>
  );
}

/** The dialog an end screen opens in: edge to edge on a phone. */
export function EndDialog(props: { open: boolean, onClose: () => void, children: ReactNode }) {
  return (
    <Dialog maxWidth={false} open={props.open} onClose={props.onClose} slotProps={{ paper: { sx: {
      marginX: { xs: 0, md: '32px' },
      maxWidth: { xs: '100%', md: 'calc(100% - 64px)' },
    } } }}>
      {props.children}
    </Dialog>
  );
}
