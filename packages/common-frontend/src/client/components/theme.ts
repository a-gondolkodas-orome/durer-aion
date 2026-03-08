declare module '@mui/material/styles' {
    interface Theme {
        opacity: opacityOptions
    }
    interface opacityOptions {
        paper: number,
    }
    // allow configuration for using `createTheme()`
    interface ThemeOptions {
        opacity: opacityOptions;
    }
}

const themeConfig = ({
    opacity: {
        paper: 0.9,
    },
    palette: {
        secondary: {
            main: '#fff',
            contrastText: '#000'
        },
        background: {
            default: '#FFF8D7',
            paper: '#fff',
        }
    },
    typography: {
        fontFamily: [
            'Poppins',
            '-apple-system',
            'sans-serif'
        ].join(',')
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
});

export default themeConfig;
