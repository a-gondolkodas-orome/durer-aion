import { Theme, useTheme } from "@mui/material/styles";
import { Select, MenuItem, Stack } from "@mui/material";
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from "react-i18next";

const Languages = {
  hu: {
    label: 'Magyar',
    flag: (
      <>
        <path fill="#ce2939" d="M0 0h60v20H0z" />
        <path fill="#fff" d="M0 20h60v20H0z" />
        <path fill="#477050" d="M0 40h60v20H0z" />
      </>
    ),
  },
  en: {
    label: 'English',
    flag: (
      <>
        <path fill="#012169" d="M0 0h60v60H0z" />
        <path stroke="#fff" strokeWidth="12" d="M0 0 60 60M60 0 0 60" />
        <path stroke="#C8102E" strokeWidth="7" d="M0 0 60 60M60 0 0 60" />
        <path stroke="#fff" strokeWidth="20" d="M30 0v60M0 30h60" />
        <path stroke="#C8102E" strokeWidth="12" d="M30 0v60M0 30h60" />
      </>
    ),
  },
} as const;

type LanguageCode = keyof typeof Languages;
const supportedCodes = Object.keys(Languages) as LanguageCode[];

const LanguageFlag = ({ langcode, dropdownid }: { langcode: LanguageCode, dropdownid?: number }) => {
  dropdownid = dropdownid ?? 1;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="24" height="24">
      <clipPath id={`clip-${dropdownid}`}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#clip-${dropdownid})`}>
        {Languages[langcode].flag}
      </g>
    </svg>
  );
}

const selectSx = (theme: Theme, color?: string) => ({
  margin: "10px",
  minWidth: "80px",
  color: color ?? '#000',
  border: theme.palette.primary.main + " 1px solid",
  borderRadius: "3px",
  "& .MuiInput-input": {
    padding: "5px 8px",
  },
  "& .MuiSvgIcon-root": { fill: color ?? '#000' },
  "&::before": { borderBottom: "transparent" },
  "&:hover:before": {
    borderBottom: "2px solid " + (color ?? theme.palette.primary.main) + " !important",
  },
  "&::after": {
    borderBottom: "2px solid " + (color ?? theme.palette.primary.main) + " !important",
  },
});

function useLanguages() {
  const { i18n } = useTranslation();
  const i18nCodes = Object.keys(i18n.options.resources ?? {});
  return supportedCodes
    .filter((code) => i18nCodes.includes(code))
    .map((code) => ({ code, label: Languages[code].label }));
}

export function LanguageDropdown({ id, fontColor, showFlagForSelected } : { id?: number, fontColor?: string, showFlagForSelected?: boolean }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const languages = useLanguages();

  return (
    <Select<string>
      value={i18n.language}
      variant="standard"
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      sx={selectSx(theme, fontColor)}
      {...(!showFlagForSelected && { 
        renderValue: (value) => {
          const lang = languages.find(({ code }) => code === value);
          if (!lang) return null;
          return (
            <Stack sx={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
              <LanguageIcon />
              {lang.label}
            </Stack>
          );
        }
      })}
    >
      {languages.map(({ code, label }) => (
        <MenuItem key={code} value={code}>
          <Stack sx={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
            <LanguageFlag langcode={code} dropdownid={id} />
            {label}
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
