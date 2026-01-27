import React from 'react';
import { SnackbarProvider } from 'notistack';
import { SuperPicture } from './picture-component';
import { CssBaseline, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
export interface LayoutProps extends React.HTMLProps<any> {
}

export const Layout: React.FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    const theme = useTheme();
    return <React.Fragment>
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
    </React.Fragment>;
};
