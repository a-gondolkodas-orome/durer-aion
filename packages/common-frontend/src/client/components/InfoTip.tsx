import { Box, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ReactNode } from 'react';

/// Details behind an ⓘ, in line with the text it explains. A tap opens it on
/// a phone, and keeps it open long enough to read.
export function InfoTip(props: { label: string, children: ReactNode }) {
  return (
    <Tooltip arrow enterTouchDelay={0} leaveTouchDelay={10000}
      title={<Box sx={{ fontSize: '14px', lineHeight: 1.45, padding: '4px' }}>{props.children}</Box>}>
      <IconButton size="small" aria-label={props.label} sx={{ padding: '2px', marginLeft: '4px', verticalAlign: '-4px', color: '#57606a' }}>
        <InfoOutlinedIcon sx={{ fontSize: '18px' }} />
      </IconButton>
    </Tooltip>
  );
}
