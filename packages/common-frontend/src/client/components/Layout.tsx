import React from 'react';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, Stack } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import importedTheme from './theme';
import { deepmerge } from '@mui/utils';
import { useVisualViewportBox } from '../hooks/visual-viewport';

export type LayoutProps = React.HTMLProps<HTMLElement>;

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    const [snackbarRoot, setSnackbarRoot] = useVisualViewportBox<HTMLDivElement>();
    return <React.Fragment>
        <ThemeProvider theme={outerTheme => createTheme(deepmerge(importedTheme, outerTheme))}>
            <CssBaseline/>
            {/* useVisualViewportBox overwrites the size; the 100% is for a browser without visualViewport. */}
            <div ref={setSnackbarRoot} style={{
              position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1400, pointerEvents: 'none',
            }}/>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              domRoot={snackbarRoot ?? undefined}
            >
                <Stack sx={(theme) => ({ backgroundColor: theme.palette.background.default })}>
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
                    <SuperPicture picture={{ webPUrl: "durerbackground.png", jpegOrPngUrl: "durerbackground.png", alt: "", title: "" }} style={{ opacity: .3, height: '100%' }}/>
                  </Stack>
                  <div>
                    {props.children}
                  </div>
                </Stack>
            </SnackbarProvider>
        </ThemeProvider>
    </React.Fragment>;
};
