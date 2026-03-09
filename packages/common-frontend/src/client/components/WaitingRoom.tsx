import { Stack, alpha } from '@mui/system';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { dictionary } from '../text-constants';

export function WaitingRoom() {
  const theme = useTheme();
  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      width: 600,
      padding: "40px",
      marginTop: "40px",
      backgroundColor: alpha(theme.palette.background.paper, theme.opacity.paper),
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

    </Stack>
  )
}