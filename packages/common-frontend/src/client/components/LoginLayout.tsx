import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SuperPicture } from './picture-component';

// The login pages' layout: the content on a card, and the logo beside it. Both
// share one grid cell, the logo pinned to the right and the card on top of it,
// so where the two do not fit side by side the logo slides under the card
// rather than shrinking, and the card keeps the text readable over it. The
// logo's size follows the width, as the card's does, so how much of it the card
// covers does not depend on the window's height. Below md there is no room for
// both, and the logo is left out.
export function LoginLayout(props: { children: React.ReactNode }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      alignItems: 'start',
      // The page's Container has no padding, so this is the gutter at every
      // width: the header's, so the card lines up with its title.
      px: { xs: '10px', sm: '24px' },
      py: { xs: 3, md: 5 },
    }}>
      <Box sx={{
        gridArea: '1 / 1',
        justifySelf: 'end',
        display: { xs: 'none', md: 'block' },
        width: 'clamp(280px, 35%, 420px)',
      }} data-testid="loginLogo">
        <SuperPicture
          picture={{ webPUrl: "durerbackground.png", jpegOrPngUrl: "durerbackground.png", alt: "", title: "" }}
          style={{ display: 'block', width: '100%', height: 'auto', opacity: .3 }}
        />
      </Box>
      <Box sx={(theme) => ({
        gridArea: '1 / 1',
        justifySelf: 'start',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: 680,
        borderRadius: 5,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
        boxShadow: '0 24px 60px rgba(36, 52, 112, 0.14)',
        backdropFilter: 'blur(10px)',
      })}>
        {props.children}
      </Box>
    </Box>
  );
}
