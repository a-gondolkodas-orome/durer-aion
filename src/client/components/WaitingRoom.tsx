import { Stack } from '@mui/system';
import React from 'react';

export function WaitingRoom() {
  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      width: 600,
      padding: "40px",
      marginTop: "40px",
      backgroundColor: "#fff",
      borderRadius: "25px",
    }}>
      <Stack sx={{
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: "50px",
      }}>
        Az online forduló hamarosan kezdődik!
      </Stack>
      <Stack sx={{
        fontSize: 32,
        marginBottom: "40px",
        marginLeft: "30px",
      }}>
        Még #:##:## van hátra kezdésig!
      </Stack>
      <Stack sx={{
        fontSize: 24,
        marginLeft: "30px",
      }}>
        A verseny kezdetekor automatikusan átirányításra kerültök a verseny felületre.
      </Stack>

    </Stack>
  )
}