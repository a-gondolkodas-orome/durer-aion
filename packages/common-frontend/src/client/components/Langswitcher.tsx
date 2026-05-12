import { alpha, Theme, useTheme } from "@mui/material/styles";
import { Select, MenuItem, Stack, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  label: string;
}

const Flags: Record<string, JSX.Element> = {
  hu: (
    <>
      <path fill="#ce2939" d="M0 0h60v20H0z" />
      <path fill="#fff" d="M0 20h60v20H0z" />
      <path fill="#477050" d="M0 40h60v20H0z" />
    </>
  ),
  en: (
    <>
      <path fill="#012169" d="M0 0h60v60H0z" />
      <path stroke="#fff" strokeWidth="12" d="M0 0 60 60M60 0 0 60" />
      <path stroke="#C8102E" strokeWidth="7" d="M0 0 60 60M60 0 0 60" />
      <path stroke="#fff" strokeWidth="20" d="M30 0v60M0 30h60" />
      <path stroke="#C8102E" strokeWidth="12" d="M30 0v60M0 30h60" />
    </>
  ),
};

const LanguageFlag = ({ code, id }: { code: string, id?: number }) => {
  id = id ?? 1;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="24" height="24">
      <clipPath id={`c${id}`}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#c${id})`}>
        {Flags[code] ?? null}
      </g>
    </svg>
  );
}

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

const selectableButtonSx = { opacity: 0.6, gap: '8px' };
const selectedButtonSx = (theme: Theme) => ({
  gap: '8px',
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

function LanguageDropdown({ compact, id }: { compact: boolean, id: number }) {
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
              <LanguageFlag code={code} id={id} />
              {label}
            </Stack>
          )}
        </MenuItem>
      ))}
    </Select>
  );
}

function LanguageButtons({ compact, direction, id }: { compact: boolean; direction: "column" | "row", id: number }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const languages = useLanguages();
  const gap = compact ? "0px" : "10px";

  return (
    <Stack sx={{ display: "flex", gap, margin: "10px", flexDirection: direction }}>
      {languages.map(({ code, label }) => {
        const isActive = i18n.language === code;
        const sx = !compact && isActive ? selectedButtonSx(theme) : selectableButtonSx;
        return (
          <Button key={code} variant={compact ? "text" : "outlined"} onClick={() => i18n.changeLanguage(code)} sx={sx}>
            {!compact && <LanguageFlag code={code} id={id} />}
            {compact ? code : label}
          </Button>
        );
      })}
    </Stack>
  );
}

export function LanguageSwitcher(props: {
  id: number;
  direction?: "column" | "row";
  variant?: "dropdown" | "buttons";
  compact?: boolean;
}) {
  const compact = props.compact ?? false;
  if (props.variant === "dropdown") {
    return <LanguageDropdown compact={compact} id={props.id} />;
  }
  return <LanguageButtons compact={compact} direction={props.direction ?? "column"} id={props.id} />;
}
