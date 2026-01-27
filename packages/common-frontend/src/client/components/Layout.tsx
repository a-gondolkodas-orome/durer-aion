import React from 'react';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, Stack, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import importedTheme from './theme';
export interface LayoutProps extends React.HTMLProps<any> {
}

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    return <React.Fragment>
        <ThemeProvider theme={outerTheme => createTheme(importedTheme, outerTheme)}>
            <CssBaseline/>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}            
            >
                <Stack sx={(theme) => ({backgroundColor: theme.palette.background.default})}>
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
