import React from 'react';
import { Button } from '@mui/material';
import { Stack } from '@mui/system';

/**
 * Component to display an end game screen with close button, and score
 * @param props {{setShow: React.Dispatch<boolean>, points: number}}
 * @returns End screen
 */
export function RelayEndTable(props: {setShow: React.Dispatch<boolean>, points: number}) {
  return (
    <Stack sx={{
      display: 'flex',
      width: "100%",
      marginLeft: '60px',
      marginTop: '30px',
      marginRight: '60px',
      marginBottom: '30px',
      borderRadius: '30px',
      backgroundColor: '#fff',
      padding: '25px',
    }}>
      <Stack>Gratulálunk, összesen {props.points} pontot szereztél. Ha új versenyt szeretnél indítani, akkor frisstísd az oldalt majd lépj ki ebből a versenyből.</Stack>
      {/*<Button sx={{
        width: '300px',
        height: '75px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={()=>{
        props.setShow(false)
      }}>
        Vissza a versenyhez
      </Button>*/}
    </Stack>
  )
}