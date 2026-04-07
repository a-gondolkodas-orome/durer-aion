import { Container, Dialog, Stack, Button } from '@mui/material';
import { useState } from 'react';
import { useLogout } from '../hooks/user-hooks';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useClientRepo } from '../api-repository-interface';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export function Header(props: { teamName: string | null }) {
  const { t } = useTranslation(undefined, { keyPrefix: 'header' });
  const theme = useTheme();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clientRepository = useClientRepo();
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
          whiteSpace: 'nowrap',
        }}>{t('title')}</Stack>
        {
          <Stack sx={{
            flexDirection: 'row',
            display: {
              xs: 'none',
              md: 'flex'
            },
            width: '100%',
            flex: 1,
            paddingTop: '40px',
            alignItems: 'center',
            overflow: 'hidden',
            paddingLeft: '10px',
            paddingRight: '10px',
          }}>
            {props.teamName &&
              <>
              <Stack sx={{
                flex: 1
              }}></Stack>
              <Stack sx={{
                fontSize: 25,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{props.teamName}</Stack>
              <Stack onClick={()=>{
                logout();
                if ( clientRepository.version === "OFFLINE") {
                  window.location.reload();
                }            
              }} sx={{
                fontSize: 20,
                margin: '0px 15px',
                cursor: 'pointer',
                "&:hover": {
                  opacity: '0.8',
                }
              }}>{t('logout')}</Stack>
            </>
            }
            <Stack sx={{
              flex: 1
            }}>
            </Stack>
          </Stack>
        }
        {props.teamName &&<Stack sx={{
          display: {
            xs: 'flex',
            md: 'none'
          },
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
          },
          whiteSpace: 'nowrap',
        }}>{t('subtitle')}</Stack>
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
            <Button onClick={()=>{
              setMobileMenuOpen(false);
              logout();
            }} variant='outlined'
            sx={{
              fontSize: 20,
              textTransform: 'capitalize'
            }}
            >{t('logout')}</Button>
        </Dialog>
      </Container>
    </Stack>
  )
}
