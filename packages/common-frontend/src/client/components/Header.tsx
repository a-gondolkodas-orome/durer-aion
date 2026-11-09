import { Box, Button, Container, Dialog, IconButton, Stack } from '@mui/material';
import { useState } from 'react';
import { useLogout } from '../hooks/user-hooks';
import { AccountCircleOutlined, Logout, MoreVert } from '@mui/icons-material';
import { useClientRepo } from '../client-repo-context';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { LanguageDropdown } from './Langswitcher';

// titles[0] and titles[1] are translation keys for the two side titles;
// titles[2] is an optional, already-translated text shown instead of the team name
/// `languageSwitcher` is for the sites that are meant to be read in either
/// language; the competition round and its admin pages are Hungarian only.
/// `compact` is for the game pages, where the height goes to the game.
export function Header(props: {
  teamName: string | null,
  compact?: boolean,
  languageSwitcher?: boolean,
  titles?: string[],
  homeAddress?: string,
  onChooseLanguage?: (language: string) => void
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const logout = useLogout();
  const { enqueueSnackbar } = useSnackbar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clientRepository = useClientRepo();
  const onLogout = () => {
    logout()
      .then(() => {
        if (clientRepository.version === "OFFLINE") {
          window.location.reload();
        }
      })
      .catch(() => {
        enqueueSnackbar(t('error.unexpected'), { variant: 'error' });
      });
  };
  const teamLabel = props.titles?.[2] ?? props.teamName;
  const title = props.titles ? t(props.titles[0]) : t('header.title');
  const subtitle = props.titles ? t(props.titles[1]) : t('header.subtitle');
  return (
    <Box component="header" sx={{
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      width: '100%',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* `maxWidth={false}`, as for the page's own Container in `Main`: otherwise
          MUI's 1280px lg width overrides the 1200px below. The padding is
          responsive for the same reason: MUI's own, 24px from sm up, overrides a
          plain value. The home pages' gutter is the same, so they line up.
          Equal side columns keep the title centred whatever the team's name. */}
      <Container maxWidth={false} sx={{
        paddingLeft: { xs: '10px', sm: '24px' },
        paddingRight: { xs: '10px', sm: '24px' },
        maxWidth: '1200px',
        height: props.compact ? 56 : { xs: 64, md: 84 },
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        columnGap: '12px',
        '& > *': { minWidth: 0 },
      }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: '10px' }}>
          {props.teamName && <>
            <Box sx={{
              display: { xs: 'none', md: 'block' },
              fontSize: props.compact ? 15 : 17,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{teamLabel}</Box>
            <Button onClick={onLogout} size="small" variant="outlined" color="inherit"
              startIcon={<Logout sx={{ fontSize: '16px !important' }} />}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                flexShrink: 0,
                borderRadius: '999px',
                borderColor: alpha(theme.palette.primary.contrastText, 0.5),
                padding: '1px 10px',
                fontSize: 13,
                lineHeight: 1.6,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.primary.contrastText,
                  backgroundColor: alpha(theme.palette.primary.contrastText, 0.12),
                },
              }}>{t('header.logout')}</Button>
          </>}
          {(props.teamName || props.languageSwitcher) &&
            <IconButton color="inherit" aria-label={t('header.menu')} onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, marginLeft: '-8px' }}>
              {props.teamName ? <AccountCircleOutlined sx={{ fontSize: '30px' }} /> : <MoreVert sx={{ fontSize: '30px' }} />}
            </IconButton>}
        </Stack>
        <Stack sx={{
          alignItems: 'center',
          textAlign: 'center',
          cursor: props.homeAddress ? 'pointer' : 'default',
        }} onClick={() => {
          if (props.homeAddress) {
            window.location.href = props.homeAddress;
          }
        }}>
          <Box sx={{
            fontSize: props.compact ? { xs: 18, md: 22 } : { xs: 20, md: 30 },
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>{title}</Box>
          {!props.compact && <Box sx={{
            fontSize: { xs: 10, md: 12 },
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: '2px',
            whiteSpace: 'nowrap',
          }}>{subtitle}</Box>}
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', display: { xs: 'none', md: 'flex' } }}>
          {props.languageSwitcher &&
            <LanguageDropdown fontColor={theme.palette.primary.contrastText} onChoose={props.onChooseLanguage} />
          }
        </Stack>
        <Dialog
          open={mobileMenuOpen}
          onClose={() => {
            setMobileMenuOpen(false)
          }}
          slotProps={{
            paper: {
              sx: {
                width: '100%',
                textAlign: 'center',
                padding: '30px',
                top: 0,
                borderRadius: '16px',
              }
            }
          }}
        >
          {props.teamName && <>
            <Stack sx={{
              fontSize: 24,
              fontWeight: 600,
              paddingTop: '10px',
              paddingBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>{teamLabel}</Stack>
            <Button onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }} variant='outlined' startIcon={<Logout />}
              sx={{
                fontSize: 18,
                borderRadius: '999px',
                textTransform: 'none',
              }}
            >{t('header.logout')}</Button>
          </>}
          {props.languageSwitcher && <LanguageDropdown onChoose={props.onChooseLanguage} />}
        </Dialog>
      </Container>
    </Box>
  )
}
