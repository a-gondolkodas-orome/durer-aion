import { useTheme } from '@mui/material/styles';
import i18next from 'i18next';
import { Select, MenuItem, Stack, Button } from '@mui/material';

type langNames = Record<string, string>;

export function LanguageSwitcher(props: { direction?: string, style?: string }) {
  const theme = useTheme();
  const gap = (props.style === 'simple') ? '0px' : '10px';
  const languageNames: langNames = {en: 'English', hu: 'Hungarian'}

  if (props.style === 'dropdown') {
    return (
      <Select
        value={i18next.language}
        variant='standard'
        onChange={(e) => i18next.changeLanguage(e.target.value)}
        sx={{ 
          margin: '10px', 
          minWidth: '80px', 
          color: theme.palette.primary.contrastText,
          '& .MuiSvgIcon-root': {
            fill: theme.palette.primary.contrastText
          },
          '&::before': {
            borderColor: theme.palette.primary.contrastText,
          },
          '&:hover': {
            borderColor: theme.palette.primary.contrastText + " !important",
          }
        }}
      >
        {['en', 'hu'].map((lang) => (
          <MenuItem key={lang} value={lang}>{languageNames[lang] ?? lang}</MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <Stack sx={{ display: 'flex', gap: gap, margin: '10px', flexDirection: props.direction ?? 'column'}}>
      {['en', 'hu'].map((lang) => (
        <Button
          key={lang}
          variant={props.style === 'simple' ? 'text' : 'outlined'}
          onClick={() => i18next.changeLanguage(lang)}
          sx={props.style === 'simple' ?
            {
              padding: '0px',
              fontSize: 13,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                textDecoration: 'underline'
              }
            }
            : {
              opacity: i18next.language === lang ? 1 : 0.6,
            }
          }
        >
          {lang}
        </Button>
      ))}
    </Stack>
  );
}
