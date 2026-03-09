declare module '@mui/material/styles' {
    interface TypeBackground {
        paperOpacity: number;
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
            paperOpacity: 0.9,
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
