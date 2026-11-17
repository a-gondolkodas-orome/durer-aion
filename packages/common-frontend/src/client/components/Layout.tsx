import React from 'react';
import { SnackbarProvider } from 'notistack';
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
                {/* At least the viewport's height, so a short page's footer sits at
                    its bottom (SiteFooter's `marginTop: auto`). dvh, not vh: on a
                    phone vh counts the browser bar too, and would scroll. */}
                <Stack sx={(theme) => ({ backgroundColor: theme.palette.background.default, minHeight: '100dvh' })}>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {props.children}
                  </div>
                </Stack>
            </SnackbarProvider>
        </ThemeProvider>
    </React.Fragment>;
};
