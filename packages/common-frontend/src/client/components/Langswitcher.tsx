import { alpha, Theme, useTheme } from "@mui/material/styles";
import { Select, MenuItem, Stack, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  label: string;
}

const FLAG_BASE_URL = "https://em-content.zobj.net/source/catrinity/458/";
const flagFileNames: Record<string, string> = {
  en: "flag-united-kingdom_1f1ec-1f1e7.png",
  hu: "flag-hungary_1f1ed-1f1fa.png",
};

const LanguageFlag = ({ code }: { code: string }) => (
  <img src={`${FLAG_BASE_URL}${flagFileNames[code]}`} style={{ width: "24px", height: "24px" }} />
);

const selectSx = (theme: Theme) => ({
  margin: "10px",
  minWidth: "80px",
  color: theme.palette.primary.contrastText,
  "& .MuiSvgIcon-root": { fill: theme.palette.primary.contrastText },
  "&::before": { borderBottom: "transparent" },
  "&:hover:before": {
    borderBottom: "2px solid " + theme.palette.primary.contrastText + " !important",
  },
});

const simpleButtonSx = (theme: Theme) => ({
  margin: "5px 0px",
  padding: "0px",
  fontSize: 13,
  color: theme.palette.primary.contrastText,
  background: theme.palette.primary.main,
  "&:hover": { textDecoration: "underline" },
});

const selectableButtonSx = { opacity: 0.6 };
const selectedButtonSx = (theme: Theme) => ({
  opacity: 1,
  "&:hover": {
    backgroundColor: "transparent",
    cursor: "unset",
    borderColor: alpha(theme.palette.primary.main, 0.5),
  },
});

function useLanguages(): Language[] {
  const { t, i18n } = useTranslation();
  return Object.keys(i18n.options.resources ?? {}).map((code) => {
    const label = t(`languages.${code}`);
    return { code, label: label === `languages.${code}` ? code : label };
  });
}

function LanguageDropdown({ compact }: { compact: boolean }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const languages = useLanguages();

  return (
    <Select
      value={i18n.language}
      variant="standard"
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      sx={selectSx(theme)}
    >
      {languages.map(({ code, label }) => (
        <MenuItem key={code} value={code}>
          {compact ? (
            code.toUpperCase()
          ) : (
            <Stack sx={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
              <LanguageFlag code={code} />
              {label}
            </Stack>
          )}
        </MenuItem>
      ))}
    </Select>
  );
}

function LanguageButtons({ compact, direction }: { compact: boolean; direction: "column" | "row" }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const languages = useLanguages();
  const gap = compact ? "0px" : "10px";

  return (
    <Stack sx={{ display: "flex", gap, margin: "10px", flexDirection: direction }}>
      {languages.map(({ code, label }) => {
        const isActive = i18n.language === code;
        const sx = compact ? simpleButtonSx(theme) : isActive ? selectedButtonSx(theme) : selectableButtonSx;
        return (
          <Button key={code} variant={compact ? "text" : "outlined"} onClick={() => i18n.changeLanguage(code)} sx={sx}>
            {!compact && <LanguageFlag code={code} />}
            {compact ? code : label}
          </Button>
        );
      })}
    </Stack>
  );
}

export function LanguageSwitcher(props: {
  direction?: "column" | "row";
  variant?: "dropdown" | "buttons";
  compact?: boolean;
}) {
  const compact = props.compact ?? false;
  if (props.variant === "dropdown") {
    return <LanguageDropdown compact={compact} />;
  }
  return <LanguageButtons compact={compact} direction={props.direction ?? "column"} />;
}
