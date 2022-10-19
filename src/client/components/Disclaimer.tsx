import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import React from 'react';

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
        Az online fordulón a csapatoknak önállóan kell dolgozniuk, külső segítséget nem fogadhatnak el, másokkal nem kommunikálhatnak egészen a versenyzési időszak végéig.
      </Stack>

      <Stack sx={{
        fontSize: 36,
        marginBottom: "10px",
        fontStyle: "italic",
      }}>
        Továbbjutás
      </Stack>
      
      <Stack sx={{
        fontSize: 16,
        marginBottom: "150px",
      }}>
        Azok a csapatok, amelyek az online forduló során a megszerezhető 52 pontból legalább 25 pontot elérnek, továbbjutnak a helyi fordulóba. (Fenntartjuk a jogot, hogy a ponthatárt esetleg csökkentsük, növelni biztosan nem fogjuk.) Az online fordulón szerzett pontszám nem számít bele a további eredményekbe.
      </Stack>

      <Button sx={{
        width: '350px',
        height: '60px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={()=>{props.setAccomplished(true)}}>
        Tovább a versenyhez
      </Button>
    </Stack>
  )
}