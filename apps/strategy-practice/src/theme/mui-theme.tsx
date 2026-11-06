import type { ReactNode } from 'react';
import { GlobalStyles } from '@mui/material';
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
// MUI's types leave out the CSS-variable props (`colorSchemeNode` below) and
// `theme.vars` until this augmentation says the theme uses CSS variables.
import type {} from '@mui/material/themeCssVarsAugmentation';

// MUI's palette in both colour schemes, built on styles.css's tokens. With
// `nativeColor` MUI takes a CSS variable as a palette colour and derives its
// shades and translucent tints in CSS, so the accent is defined once, there.
const primary = { main: 'var(--color-primary)', contrastText: '#fff' };

export const muiTheme = createTheme({
  cssVariables: {
    nativeColor: true,
    // The dark palette applies under the `.dark` class theme-context.tsx puts
    // on <html>, the same one Tailwind's `dark:` variant reads.
    colorSchemeSelector: '.%s',
    // `color-scheme` restyles every native control and scrollbar on the page,
    // which is not MUI's to decide here.
    disableCssColorScheme: true
  },
  colorSchemes: { light: { palette: { primary } }, dark: { palette: { primary } } }
});

// Renders MUI components in the site's colours, light or dark. Which scheme is
// showing is theme-context.tsx's decision alone: `colorSchemeNode={null}` stops
// MUI writing its own class onto <html>, and `storageManager={null}` its own
// remembered mode.
//
// `enableCssLayer` puts MUI's styles in a `mui` cascade layer, ordered above
// Tailwind's preflight reset and below its utilities, so a utility class on a
// MUI component wins over MUI's own style. The order has to be stated here, not
// in styles.css: the first mention of a layer fixes its place, and MUI puts its
// styles at the top of <head>, ahead of the stylesheet — which would leave `mui`
// first and lowest, under the reset that zeroes its padding.
export const MuiThemeProvider = ({ children }: { children: ReactNode }) => (
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <ThemeProvider theme={muiTheme} colorSchemeNode={null} storageManager={null}>
      {children}
    </ThemeProvider>
  </StyledEngineProvider>
);
