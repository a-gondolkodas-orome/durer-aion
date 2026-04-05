import { useTheme } from '@mui/material/styles';
import i18next from 'i18next';
import { Select, MenuItem, Stack, Button } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

type langNames = Record<string, string>;

export function LanguageSwitcher(props: { direction?: string, style?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const gap = (props.style === 'simple') ? '0px' : '10px';
  const languagesArray = Object.keys(i18n.options.resources ?? {})
  const allLanguages: langNames = {};
  languagesArray.forEach(l => {
    allLanguages[l] = t(`languages.${l}`);
    if (allLanguages[l] === `languages.${l}`) {
      allLanguages[l] = l;
    }
  });

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
            borderBottom: "transparent",
          },
          '&:hover:before': {
            borderBottom: "2px solid " + theme.palette.primary.contrastText + " !important",
          }
        }}
      >
        {Object.keys(allLanguages).map((lang) => (
          <MenuItem key={lang} value={lang}>{allLanguages[lang]}</MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <Stack sx={{ display: 'flex', gap: gap, margin: '10px', flexDirection: props.direction ?? 'column'}}>
      {Object.keys(allLanguages).map((lang) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stylesObject: any = {opacity: 0.6};
        if (i18next.language === lang) {
          stylesObject.opacity = 1;
          stylesObject["&:hover"] = {backgroundColor: "transparent", cursor: "unset"};
        }
        return (
        <Button
          key={lang}
          variant={props.style === 'simple' ? 'text' : 'outlined'}
          onClick={() => i18next.changeLanguage(lang)}
          sx={props.style === 'simple' ?
            {
              margin: '5px 0px',
              padding: '0px',
              fontSize: 13,
              color: theme.palette.primary.contrastText,
              background: theme.palette.primary.main,
              "&:hover": {
                textDecoration: 'underline'
              }
            }
            : stylesObject
          }
        >
          {props.style !== 'simple' && <LanguageIcon sx={{ paddingRight: '5px' }}/>}
          {props.style === 'simple' ? lang : allLanguages[lang]}
        </Button>
      )}
    )}
    </Stack>
  );
}
