import React from 'react';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, GlobalStyles, Stack } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import importedTheme from './theme';
import { deepmerge } from '@mui/utils';
import { VISUAL_VIEWPORT_TOP, useVisualViewportTop } from '../hooks/visual-viewport';

// notistack's own distance from the top of the screen, which its class sets
// as a fixed `top`; the provider below adds the visual viewport's offset to it.
const SNACKBAR_TOP = '14px';

export type LayoutProps = React.HTMLProps<HTMLElement>;

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    useVisualViewportTop();
    return <React.Fragment>
        <ThemeProvider theme={outerTheme => createTheme(deepmerge(importedTheme, outerTheme))}>
            <CssBaseline/>
            {/* Two classes, to outrank the single one notistack sets `top` with. */}
            <GlobalStyles styles={{
              '.notistack-SnackbarContainer.follows-visual-viewport': {
                top: `calc(${VISUAL_VIEWPORT_TOP} + ${SNACKBAR_TOP})`,
              },
            }}/>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              classes={{ containerAnchorOriginTopRight: 'follows-visual-viewport' }}
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
