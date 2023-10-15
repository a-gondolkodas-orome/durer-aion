import { Container, Dialog, Menu, Stack } from '@mui/material';
import React, { useState } from 'react';
import { useLogout } from '../hooks/user-hooks';
import theme from './theme';
import { dictionary } from '../text-constants';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

export function Header(props: { teamName: string | null }) {
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <Stack sx={{
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      width: '100%',
      height: 102,
    }}>
      <Container sx={{
        paddingLeft: '10px',
        paddingRight: '10px',
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
          fontSize: {
            xs: 25,
            md: 40
          },
          fontWeight: 'bold',
          paddingTop: '20px',
        }}>{dictionary.header.title}</Stack>
        {props.teamName &&
          <Stack sx={{
            flexDirection: 'row',
            display: {
              xs: 'none',
              md: 'flex'
            },
            paddingTop: '40px',
            alignItems: 'center',
          }}>
            <Stack sx={{
              fontSize: 25,
            }}>{props.teamName}</Stack>
            <Stack onClick={()=>{
              logout();
              if (process.env.REACT_APP_WHICH_VERSION === "b"){
                window.location.reload();
              }            
            }} sx={{
              fontSize: 20,
              marginLeft: '15px',
              cursor: 'pointer',
              "&:hover": {
                opacity: '0.8',
              }
            }}>{dictionary.header.logout}</Stack>
          </Stack>
        }
        {props.teamName &&<Stack sx={{
          display: {
            xs: 'flex',
            md: 'none'
          }
        }}><PowerSettingsNewIcon onClick={()=>{
          setMobileMenuOpen(true)
        }} sx={{
         fontSize: '35px' 
        }}/></Stack>}
        <Stack sx={{
          fontSize: 30,
          fontWeight: 'bold',
          paddingTop: '30px',
          display: {
            xs: 'none',
            md: 'flex'
          }
        }}>{dictionary.header.subtitle}</Stack>
        <Dialog
          open={mobileMenuOpen}
          onClose={()=>{
            setMobileMenuOpen(false)
          }}
          PaperProps = {{
            sx: {
              width: '100%',
              textAlign: 'center',
              padding: '30px',
              top: 0
            }
          }}
        >
           <Stack sx={{
              fontSize: 30,
              paddingTop: '10px',
              paddingBottom: '20px',
            }}>{props.teamName}</Stack>
            <Stack onClick={()=>{  
              setMobileMenuOpen(false);
              logout();
            }} sx={{
              fontSize: 20,
              marginLeft: '15px',
              cursor: 'pointer',
              "&:hover": {
                opacity: '0.8',
              }
            }}>{dictionary.header.logout}</Stack>
        </Dialog>
      </Container>
    </Stack>
  )
}
