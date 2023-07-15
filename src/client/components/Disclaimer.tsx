import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import React from 'react';
import { dictionary } from '../text-constants';

export function Disclaimer(props: {setAccomplished: React.Dispatch<boolean>}) {
  return (
    <Stack sx={{
      display: 'flex',
      height: '',
      width: '100%',
      padding: "40px",
      margin: "40px",
      backgroundColor: "#fff",
      borderRadius: "30px",
    }}>
      <Stack sx={{
        fontSize: 16,
        marginBottom: "25px"
      }}>
        {dictionary.disclaimer.start}
      </Stack>

      <Stack sx={{
        fontSize: 36,
        marginBottom: "10px",
        fontStyle: "italic",
      }}>
        {dictionary.disclaimer.progress}
      </Stack>
      
      <Stack sx={{
        fontSize: 16,
        marginBottom: "150px",
      }}>
        {dictionary.disclaimer.progressDescription}
      </Stack>

      <Button sx={{
        width: '350px',
        height: '60px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={()=>{props.setAccomplished(true)}}>
        {dictionary.disclaimer.continue}
      </Button>
    </Stack>
  )
}