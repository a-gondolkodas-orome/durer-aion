import { Box, Button, Container, Dialog, IconButton, Stack, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useLogout } from '../hooks/user-hooks';
import { AccountCircleOutlined, ArrowBackRounded, Logout } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { LanguageDropdown } from './Langswitcher';
import type { Heading } from './competition-heading';
import { RoundsBadge, RoundsList } from './RoundsBadge';
import type { RoundsView } from './rounds-view';

/// How wide a page gets. The strategy page is wider, as the game's rules sit
/// beside its board.
export const PAGE_MAX_WIDTH = 1200;
export const STRATEGY_PAGE_MAX_WIDTH = 1320;

/// `heading` is the two lines in the middle, already translated; without one,
/// the online round's before login. `teamLabel` is shown in place of the team's
/// name.
/// `languageSwitcher` is for a page meant to be read in either language: the
/// practice sites, and a team's pages in a competition held in both.
/// `compact` is for the game pages, where the height goes to the game.
/// `maxWidth` is the page's own, so the header's edges line up with it.
/// `leaveLabel` names the logout button for a site where logging out is not
/// leaving, such as the relay practice, where it goes back to the round
/// selector; the button then shows a back arrow instead of the exit icon. On
/// a wide screen the button is the icon alone, the label its tooltip.
/// `rounds` is the team's two rounds while it is on one of them, for the
/// badge that names the other. A phone has no room for it beside the language
/// switcher: there the account menu lists the rounds instead.
export function Header(props: {
  teamName: string | null,
  leaveLabel?: string,
  compact?: boolean,
  maxWidth?: number,
  languageSwitcher?: boolean,
  heading?: Heading,
  teamLabel?: string,
  homeAddress?: string,
  onChooseLanguage?: (language: string) => void,
  rounds?: RoundsView,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const logout = useLogout();
  const { enqueueSnackbar } = useSnackbar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const onLogout = () => {
    logout()
      .catch(() => {
        enqueueSnackbar(t('error.unexpected'), { variant: 'error' });
      });
  };
  const teamLabel = props.teamLabel ?? props.teamName;
  const leaveLabel = props.leaveLabel ?? t('header.logout');
  const LeaveIcon = props.leaveLabel ? ArrowBackRounded : Logout;
  const { title, subtitle } = props.heading ?? { title: t('header.titlePlain'), subtitle: t('header.subtitle') };
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
        maxWidth: `${props.maxWidth ?? PAGE_MAX_WIDTH}px`,
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
            <Tooltip title={leaveLabel}>
              <IconButton onClick={onLogout} size="small" color="inherit" aria-label={leaveLabel}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  flexShrink: 0,
                  border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.5)}`,
                  padding: '4px',
                  '&:hover': {
                    borderColor: theme.palette.primary.contrastText,
                    backgroundColor: alpha(theme.palette.primary.contrastText, 0.12),
                  },
                }}>
                <LeaveIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
          </>}
          {props.teamName &&
            <IconButton color="inherit" aria-label={t('header.menu')} onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, marginLeft: '-8px' }}>
              <AccountCircleOutlined sx={{ fontSize: '30px' }} />
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
        <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
          {props.rounds && <>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <RoundsBadge view={props.rounds}/>
            </Box>
            {!props.languageSwitcher && <Box sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 0 }}>
              <RoundsBadge view={props.rounds} compact/>
            </Box>}
            {props.languageSwitcher && <Box aria-hidden sx={{
              display: { xs: 'none', md: 'block' }, width: '1px', height: '24px',
              backgroundColor: alpha(theme.palette.primary.contrastText, 0.35),
            }}/>}
          </>}
          {props.languageSwitcher && <>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <LanguageDropdown fontColor={theme.palette.primary.contrastText} onChoose={props.onChooseLanguage} />
            </Box>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <LanguageDropdown compact fontColor={theme.palette.primary.contrastText} onChoose={props.onChooseLanguage} />
            </Box>
          </>}
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
            {props.rounds && <Box sx={{
              border: '1px solid #eef0f2', borderRadius: '12px', padding: '6px 14px 10px', marginBottom: '20px',
            }}>
              <RoundsList view={props.rounds}/>
            </Box>}
            <Button onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }} variant='outlined' startIcon={<LeaveIcon />}
              sx={{
                fontSize: 18,
                borderRadius: '999px',
                textTransform: 'none',
              }}
            >{leaveLabel}</Button>
          </>}
        </Dialog>
      </Container>
    </Box>
  )
}
