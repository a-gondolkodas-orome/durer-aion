import { Container, Stack } from '@mui/material';
import React from 'react';
import { useLogout } from '../hooks/user-hooks';
import theme from './theme';

export function Header(props: { teamName: string | null }) {
  const logout = useLogout()
  return (
    <Stack sx={{
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      width: '100%',
      height: 102,
    }}>
      <Container sx={{
        paddingLeft: 0,
        paddingRight: 0,
        zIndex: 3,
        position: 'relative',
        maxWidth: '1200px',
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'space-between',
        height: '100%',
        alignItems: 'center'
      }}>
        <Stack sx={{
          fontSize: 40,
          fontWeight: 'bold',
          paddingTop: '20px',
        }}>XVI. Dürer Verseny</Stack>
        {props.teamName &&
          <Stack sx={{
            flexDirection: 'row',
            display: 'flex',
            paddingTop: '40px',
            alignItems: 'center',
          }}>
            <Stack sx={{
              fontSize: 25,
            }}>{props.teamName}</Stack>
            <Stack onClick={()=>{logout()}} sx={{
              fontSize: 20,
              marginLeft: '15px',
              cursor: 'pointer',
              "&:hover": {
                opacity: '0.8',
              }
            }}>kijelentkezés</Stack>
          </Stack>
        }
        <Stack sx={{
          fontSize: 30,
          fontWeight: 'bold',
          paddingTop: '30px',
        }}>Online forduló</Stack>
      </Container>
    </Stack>
  )
}
