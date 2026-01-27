import React from 'react';
import importedtheme from './theme';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, Stack, ThemeProvider } from '@mui/material';
export interface LayoutProps extends React.HTMLProps<any> {
}

const deepMerge = React.useMemo(() => (target: any, source: any, filter: (key: string, value: any) => boolean): any => {
  if (!source || typeof source !== 'object') {
    return target;
  }
  if (!target || typeof target !== 'object') {
    target = {...source};
  }
  for (const key in source) {
    if (source.hasOwnProperty(key) && filter(key, source[key])) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key], filter);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}, []);

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    return <React.Fragment>
        <ThemeProvider theme={(outerTheme) => deepMerge(outerTheme, importedtheme, (key, value) => key !== 'background')} >
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
