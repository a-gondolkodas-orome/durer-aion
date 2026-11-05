import { Box, Stack } from '@mui/system';
import { Button, Dialog, TextField } from '@mui/material';
import { Dispatch, ReactNode, useState } from 'react';
import WarningAmber from '@mui/icons-material/WarningAmber';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { BORDER, DANGER, DANGER_DIVIDER, DIALOG_BACKGROUND, DIVIDER, FOOTER_BACKGROUND, MUTED } from './adminStyles';

export interface ConfirmDialogInterface {
  /// What is about to happen, as a short heading: "Idő hozzáadása".
  title: string;
  /// What the action applies to and with what, each on a line of its own:
  /// the team, the match, the minutes.
  facts?: { label: string, value: ReactNode }[];
  /// What the action does beyond what the title says.
  description?: ReactNode;
  /// The confirm button's label, naming the action rather than "OK".
  confirmLabel: string;
  /// For an action that cannot be undone: red, with a warning sign.
  danger?: boolean;
  confirm: () => Promise<void>;
  /// When set, the confirm button stays disabled until one of these words is
  /// typed, for actions that are too easy to trigger by a stray click.
  requiredWords?: string[];
}

const TITLE_ID = 'confirm-dialog-title';
const DESCRIPTION_ID = 'confirm-dialog-description';

// Case, accents and surrounding spaces do not matter: "valto" is accepted.
const fold = (s: string) => s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function ConfirmDialog(props: { confirmDialog: ConfirmDialogInterface | null, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const { confirmDialog, setConfirmDialog } = props;
  const danger = confirmDialog?.danger ?? false;
  return <Dialog
    open={confirmDialog != null}
    onClose={() => setConfirmDialog(null)}
    aria-labelledby={TITLE_ID}
    // Only the description describes the dialog: the facts are a list of their
    // own, and the typed-word field has its own label.
    aria-describedby={confirmDialog?.description ? DESCRIPTION_ID : undefined}
    slotProps={{ paper: { sx: {
      width: 520,
      maxWidth: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
      margin: { xs: '12px', sm: '32px' },
      borderRadius: '12px',
      border: `1px solid ${danger ? DANGER_DIVIDER : BORDER}`,
      backgroundColor: DIALOG_BACKGROUND,
      fontSize: 14,
    } } }}
  >
    {confirmDialog && <ConfirmContent confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog}/>}
  </Dialog>;
}

// Mounted only while a dialog is open, so the typed word starts empty each time.
function ConfirmContent(props: { confirmDialog: ConfirmDialogInterface, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const { confirmDialog, setConfirmDialog } = props;
  const [typed, setTyped] = useState('');
  const { requiredWords, facts, description } = confirmDialog;
  const danger = confirmDialog.danger ?? false;
  const allowed = requiredWords === undefined || requiredWords.some(w => fold(w) === fold(typed));
  const Icon = danger ? WarningAmber : InfoOutlined;
  return <>
    <Stack sx={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: '12px',
      padding: { xs: '16px', sm: '20px 24px' },
      backgroundColor: '#fff',
      borderBottom: `1px solid ${danger ? DANGER_DIVIDER : BORDER}`,
      borderRadius: '12px 12px 0 0',
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: '20px',
        backgroundColor: danger ? '#fdecea' : '#e3f2fd',
        color: danger ? DANGER : 'primary.main',
      }}>
        <Icon sx={{ fontSize: 22 }}/>
      </Box>
      <Stack sx={{ gap: '2px', minWidth: 0 }}>
        <Box sx={{ fontSize: 12, fontWeight: 500, color: MUTED }}>Megerősítés szükséges</Box>
        <Box component="h2" id={TITLE_ID} sx={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.25, color: danger ? DANGER : 'text.primary' }}>
          {confirmDialog.title}
        </Box>
      </Stack>
    </Stack>
    <Stack sx={{ gap: '16px', padding: { xs: '16px', sm: '20px 24px' } }}>
      {facts && facts.length > 0 && <Box component="dl" sx={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: '8px 16px',
        margin: 0,
        padding: '12px 16px',
        backgroundColor: '#fff',
        border: `1px solid ${DIVIDER}`,
        borderRadius: '8px',
      }}>
        {facts.map(fact => <Box key={fact.label} sx={{ display: 'contents' }}>
          <Box component="dt" sx={{ fontSize: 13, color: MUTED }}>{fact.label}</Box>
          <Box component="dd" sx={{ margin: 0, fontWeight: 600, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{fact.value}</Box>
        </Box>)}
      </Box>}
      {description && <Box id={DESCRIPTION_ID} sx={{ color: MUTED, lineHeight: 1.5, '& code': { fontSize: 12, backgroundColor: '#f5f5f5', padding: '1px 4px', borderRadius: '3px' } }}>
        {description}
      </Box>}
      {requiredWords !== undefined && <TextField
        size="small"
        autoComplete="off"
        autoFocus
        label={`Írd be: ${requiredWords.join(' / ')}`}
        value={typed}
        onChange={e => setTyped(e.target.value)}
      />}
    </Stack>
    <Stack sx={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: '8px 12px',
      padding: { xs: '12px 16px', sm: '12px 24px' },
      backgroundColor: FOOTER_BACKGROUND,
      borderTop: `1px solid ${danger ? DANGER_DIVIDER : DIVIDER}`,
      borderRadius: '0 0 12px 12px',
    }}>
      <Button variant="outlined" color="inherit" sx={{ textTransform: 'none', height: 40, color: MUTED, borderColor: BORDER }}
        onClick={() => setConfirmDialog(null)}>
        Mégse
      </Button>
      <Button
        variant="contained"
        color={danger ? 'error' : 'primary'}
        disabled={!allowed}
        sx={{ textTransform: 'none', height: 40 }}
        onClick={() => {
          void confirmDialog.confirm();
          setConfirmDialog(null);
        }}
      >
        {confirmDialog.confirmLabel}
      </Button>
    </Stack>
  </>;
}

/// The minutes as typed, signed, so a negative number reads as time taken away.
export function formatMinutes(minutes: number) {
  return `${minutes > 0 ? '+' : ''}${minutes} perc`;
}
