import { Stack } from '@mui/system';
import { Button, Dialog, TextField } from '@mui/material';
import { Dispatch, useState } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface ConfirmDialogInterface {
  text: string;
  confirm: () => Promise<void>;
  /// When set, the confirm button stays disabled until one of these words is
  /// typed, for actions that are too easy to trigger by a stray click.
  requiredWords?: string[];
}

/// Both spellings, so an admin without a Hungarian keyboard need not paste the accents.
export const DELETE_WORDS = ['törlés', 'delete'];

// Case, accents and surrounding spaces do not matter: "torles" is accepted.
const fold = (s: string) => s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function ConfirmDialog(props: { confirmDialog: ConfirmDialogInterface | null, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const [confirmDialog, setConfirmDialog] = [props.confirmDialog, props.setConfirmDialog];
  return <Dialog
  maxWidth={false}
  slotProps={{ paper: {
    sx: {
      marginLeft: {
        xs: 0,
        md: '32px'
      },
      marginRight: {
        xs: 0,
        md: '32px'
      },
      maxWidth: {
        xs: '100%',
        md: 'calc(100% - 64px)'
      },
    }
  } }}
  open={
    confirmDialog != null
  } onClose={() => {
      setConfirmDialog(null);
     }}>
    {confirmDialog && <Stack
      sx={{
        width: "700px",
        maxWidth: "calc(100% - 12px)",
        padding: "12px",
        fontSize: 16,
        alignItems: 'center',
      }}
    >
      <WarningAmberIcon sx={{ color: '#FF0000', fontSize: '150px' }} />
      <Stack>{confirmDialog.text}</Stack>
      <ConfirmControls confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Stack>}
  </Dialog>
}

// Mounted only while a dialog is open, so the typed word starts empty each time.
function ConfirmControls(props: { confirmDialog: ConfirmDialogInterface, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const { confirmDialog, setConfirmDialog } = props;
  const [typed, setTyped] = useState('');
  const { requiredWords } = confirmDialog;
  const allowed = requiredWords === undefined || requiredWords.some(w => fold(w) === fold(typed));
  return <>
    {requiredWords !== undefined && <TextField
      sx={{ margin: '16px 0' }}
      size="small"
      autoComplete="off"
      autoFocus
      label={`Írd be: ${requiredWords.join(' / ')}`}
      value={typed}
      onChange={e => setTyped(e.target.value)}
    />}
    <Button
      sx={{ width: "130px", height: "45px", alignSelf: "center" }}
      color='primary'
      variant='contained'
      disabled={!allowed}
      onClick={() => {
        void confirmDialog.confirm()
        setConfirmDialog(null);
      }}
    >
      Megerősítés
    </Button>
  </>;
}
