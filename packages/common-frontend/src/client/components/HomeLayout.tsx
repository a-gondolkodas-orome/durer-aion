import React from 'react';
import { Box } from '@mui/material';
import { SuperPicture } from './picture-component';

// The home pages' layout: the content, and the logo in a column of its own
// beside it, so the two cannot overlap at any width. Below md there is no room
// for both, and the logo is left out.
export function HomeLayout(props: { children: React.ReactNode }) {
  return (
    <Box sx={{
      display: 'grid',
      // `fit-content`: the content column is as wide as the content asks, up
      // to the relay practice card's 680px, and the logo takes the rest.
      gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        md: 'fit-content(680px) minmax(0, 1fr)',
      },
      columnGap: 6,
      alignItems: 'center',
      // The page's Container has no padding, so this is the gutter at every
      // width: the header's, so the content lines up with its title.
      px: { xs: '10px', sm: '24px' },
      py: { xs: 3, md: 5 },
    }}>
      <Box sx={{ minWidth: 0 }}>
        {props.children}
      </Box>
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'center',
      }} data-testid="homeLogo">
        <SuperPicture
          picture={{ webPUrl: "durerbackground.png", jpegOrPngUrl: "durerbackground.png", alt: "", title: "" }}
          style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', opacity: .3 }}
        />
      </Box>
    </Box>
  );
}
