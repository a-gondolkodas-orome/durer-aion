import React from 'react';
import theme from './theme';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, Stack, ThemeProvider } from '@mui/material';
export interface MyProps extends React.HTMLProps<any> {
}

export const Layout: React.FunctionComponent<MyProps> = (props: MyProps) => {
    return <React.Fragment>
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}            
            >
                <Stack sx={{backgroundColor: theme.palette.background.default}}>
                  <Stack sx={{
                      position: 'absolute',
                      right: 0, top: 100,
                      display: {
                        xs: 'none',
                        md: 'flex',
                      },
                      overflow: "hidden",
                      height: 'calc(100% - 100px)'
                    }}>
                    <SuperPicture picture={{webPUrl: "durerbackground.png", jpegOrPngUrl: "durerbackground.png", alt: "", title: ""}} style={{opacity:.3}}/>
                  </Stack>
                  <div>
                    {props.children}
                  </div>
                </Stack>
            </SnackbarProvider>
        </ThemeProvider>
    </React.Fragment>;
};
