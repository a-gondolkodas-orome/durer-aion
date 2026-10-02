import React from 'react';
import { SnackbarProvider } from 'notistack';
import { CssBaseline, Stack } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import importedTheme from './theme';
import { deepmerge } from '@mui/utils';

export type LayoutProps = React.HTMLProps<HTMLElement>;

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    return <React.Fragment>
        <ThemeProvider theme={outerTheme => createTheme(deepmerge(importedTheme, outerTheme))}>
            <CssBaseline/>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
                <Stack sx={(theme) => ({ backgroundColor: theme.palette.background.default })}>
                  <div>
                    {props.children}
                  </div>
                </Stack>
            </SnackbarProvider>
        </ThemeProvider>
    </React.Fragment>;
};
