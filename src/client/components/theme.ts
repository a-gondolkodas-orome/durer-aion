import { createTheme } from "@mui/material/styles";


const theme = createTheme({
    palette: {
        primary: {
            main: '#7B021A',
            contrastText: '#fff'
        },
        secondary: {
            main: '#fff',
            contrastText: '#000'
        },
        background: {
            default: '#FFF8D7',
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

export default theme;
