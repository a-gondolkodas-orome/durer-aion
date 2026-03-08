import { Stack } from '@mui/system';
import { dictionary } from '../text-constants';
import { Paper } from "./PaperWrapper";

export function WaitingRoom() {
  return (
    <Paper sx={{
      height: '100%',
      width: 600,
      padding: "40px",
      marginTop: "40px",
      borderRadius: "25px",
    }}>
      <Stack sx={{
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: "50px",
      }}>
        {dictionary.waitingRoom.soon}
      </Stack>
      <Stack sx={{
        fontSize: 32,
        marginBottom: "40px",
        marginLeft: "30px",
      }}>
        {dictionary.waitingRoom.remainingStart} #:##:## {dictionary.waitingRoom.remainingEnd}
      </Stack>
      <Stack sx={{
        fontSize: 24,
        marginLeft: "30px",
      }}>
        {dictionary.waitingRoom.instruction}
      </Stack>

    </Paper>
  )
}