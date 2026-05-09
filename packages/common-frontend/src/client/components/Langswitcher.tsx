import { alpha, SxProps, useTheme } from '@mui/material/styles';
import i18n from 'i18next';
import { Select, MenuItem, Stack, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

type langNamesByCodes = Record<string, string>;
type langFlagsByCodes = Record<string, string>;

interface langButtonStyles {
  opacity: number;
  "&:hover"?: SxProps;
}

export function LanguageSwitcher(props: { direction?: ("column"|"row"), style?: ("simple"|"dropdown"|"simple-dropdown") }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const gap = (props.style === 'simple') ? '0px' : '10px';
  const languagesArray = Object.keys(i18n.options.resources ?? {})
  const allLanguages: langNamesByCodes = {};
  const flagFileNames: langFlagsByCodes = {"en": "flag-united-kingdom_1f1ec-1f1e7.png", "hu": "flag-hungary_1f1ed-1f1fa.png"};
  const languageFlag = (lang: string) => <img src={`https://em-content.zobj.net/source/catrinity/458/${flagFileNames[lang]}`} style={{ width: '24px', height: '24px' }}/> 
  languagesArray.forEach(l => {
    allLanguages[l] = t(`languages.${l}`);
    if (allLanguages[l] === `languages.${l}`) {
      allLanguages[l] = l;
    }
  });

  if (props.style?.includes('dropdown')) {
    return (
      <Select
        value={i18n.language}
        variant='standard'
        onChange={(e) => i18n.changeLanguage(e.target.value)}
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
          <MenuItem key={lang} value={lang}>{
            props.style?.includes("simple") 
              ? lang.toUpperCase() 
              : <Stack sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: "row" }}>{languageFlag(lang)}{allLanguages[lang]}</Stack>
          }</MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <Stack sx={{ display: 'flex', gap: gap, margin: '10px', flexDirection: props.direction ?? 'column'}}>
      {Object.keys(allLanguages).map((lang) => {
        const stylesObject: langButtonStyles = {opacity: 0.6};
        if (i18n.language === lang) {
          stylesObject.opacity = 1;
          stylesObject["&:hover"] = {backgroundColor: "transparent", cursor: "unset", borderColor: alpha(theme.palette.primary.main, 0.5)};
        }
        return (
        <Button
          key={lang}
          variant={props.style === 'simple' ? 'text' : 'outlined'}
          onClick={() => i18n.changeLanguage(lang)}
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
          {props.style !== 'simple' && languageFlag(lang)}
          {props.style === 'simple' ? lang : allLanguages[lang]}
        </Button>
      )}
    )}
    </Stack>
  );
}
