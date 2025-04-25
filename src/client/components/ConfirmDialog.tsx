import { Stack } from '@mui/system';
import { Button, Dialog } from '@mui/material';
import { Dispatch } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface ConfirmDialog {
  text: String;
  confirm: Function;
}

export function ConfirmDialog(props: {confirmDialog: ConfirmDialog | null, setConfirmDialog: Dispatch<ConfirmDialog|null>}) {
  const [confirmDialog, setConfirmDialog] = [props.confirmDialog, props.setConfirmDialog];
  return <Dialog 
  maxWidth={false} 
  PaperProps={{
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
  }}
  open={
    confirmDialog != null
  } onClose={async () => {
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
      <Button
        sx={{width:"130px", height: "45px", alignSelf: "center"}}
        color='primary'
        variant='contained'
        onClick={()=>{
          confirmDialog.confirm()
          setConfirmDialog(null);
        }}
      >
        Megerősítés
      </Button>
    </Stack>}
  </Dialog>
}