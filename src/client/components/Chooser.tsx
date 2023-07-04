import { Stack } from '@mui/system';
import React from 'react';
import { ChooserItem } from './ChooserItem';

export function Chooser(props: {setStarted: React.Dispatch<string>}) {
  return (
    <Stack sx={{
      display: 'flex',
      width: '100%',
      margin: "40px",
      flexDirection: "row"
    }}>
      <ChooserItem setStarted={props.setStarted} type="relay" />
      <Stack sx={{width: "20px"}}/>
      <ChooserItem setStarted={props.setStarted} type="strategias" />
    </Stack>
  )
}