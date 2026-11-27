import { Box, ButtonBase, Popover, Stack } from '@mui/material';
import CheckRounded from '@mui/icons-material/CheckRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { LIVE_COLOUR } from './ResultTables';
import type { Round, RoundsView } from './rounds-view';

const DONE = '#2e7d32';
const DONE_TEXT = '#1b5e20';
const LIVE_TEXT = '#9a3412';
const MUTED = '#57606a';
const LINE = '#eef0f2';

/// A round's state at a glance, in shape as well as colour: a filled dot for
/// the one under way, a tick for a finished one, a dashed ring for one not
/// started. `onDark` for the header's own colour.
function RoundMarker(props: { round: Round, onDark?: boolean }) {
  const { state } = props.round.status;
  if (state === 'FINISHED') {
    return <Box aria-hidden sx={{
      width: 16, height: 16, flexShrink: 0, borderRadius: '50%', backgroundColor: DONE, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}><CheckRounded sx={{ fontSize: 12 }}/></Box>;
  }
  if (state === 'IN PROGRESS') {
    return <Box aria-hidden sx={{ width: 10, height: 10, flexShrink: 0, borderRadius: '50%', backgroundColor: LIVE_COLOUR,
      boxShadow: props.onDark ? '0 0 0 2px #fff' : 'none' }}/>;
  }
  return <Box aria-hidden sx={{ width: 10, height: 10, flexShrink: 0, borderRadius: '50%', boxSizing: 'border-box',
    border: `1.5px dashed ${props.onDark ? '#fff' : MUTED}` }}/>;
}

function statusText(t: TFunction, round: Round): string {
  switch (round.status.state) {
    case 'FINISHED': return t('rounds.finishedPoints', { points: t('general.points', { count: round.status.score }) });
    case 'IN PROGRESS': return t('rounds.now');
    default: return t('rounds.notStarted');
  }
}

/// What is left to say once both rounds are listed: where the other round
/// starts, or that the score adds up.
function hint(t: TFunction, view: RoundsView): string {
  if (view.other.status.state === 'NOT STARTED') {
    return view.other.type === 'relay' ? t('rounds.hint.relayLeft') : t('rounds.hint.strategyLeft');
  }
  return view.current.status.state === 'FINISHED' ? t('rounds.hint.total') : t('rounds.hint.last');
}

/// Both rounds, the page's own first, and the hint: the badge's popover, and
/// the phone's account menu.
export function RoundsList(props: { view: RoundsView }) {
  const { t } = useTranslation();
  const { current, other } = props.view;
  const row = (round: Round, isCurrent: boolean) => {
    const { state } = round.status;
    return (
      <Stack direction="row" sx={{ alignItems: 'center', gap: '10px', paddingY: '10px', fontSize: 15 }}>
        <Box sx={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}><RoundMarker round={round}/></Box>
        <Box sx={{ flex: 1, fontWeight: isCurrent ? 600 : 400 }}>{round.type === 'relay' ? t('relay.name') : t('strategy.name')}</Box>
        <Box sx={{
          fontWeight: state === 'NOT STARTED' ? 400 : 600,
          color: state === 'FINISHED' ? DONE_TEXT : state === 'IN PROGRESS' ? LIVE_TEXT : MUTED,
        }}>{statusText(t, round)}</Box>
      </Stack>
    );
  };
  return (
    <Stack sx={{ textAlign: 'left' }}>
      <Box sx={{ fontWeight: 700, fontSize: 16 }}>{t('rounds.title')}</Box>
      <Box sx={{ borderBottom: `1px solid ${LINE}` }}>{row(current, true)}</Box>
      {row(other, false)}
      <Box sx={{ fontSize: 13, color: MUTED, lineHeight: 1.45, marginTop: '2px' }}>{hint(t, props.view)}</Box>
    </Stack>
  );
}

/// The header's word on the competition's other round, which opens onto both
/// (#744). The page is about the current round, so the badge names only the
/// other. `compact` is the phone's: its short name alone, and the list opens
/// the header's full width under it.
export function RoundsBadge(props: { view: RoundsView, compact?: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const popoverId = useId();
  const { other } = props.view;
  const otherName = other.type === 'relay' ? t('rounds.short.relay') : t('rounds.short.strategy');
  const otherStatus = other.status.state === 'FINISHED'
    ? t('general.points', { count: other.status.score })
    : statusText(t, other);
  const contrast = theme.palette.primary.contrastText;
  // On a phone the list hangs from the header itself, edge to edge.
  const header = props.compact ? anchor?.closest('header') ?? anchor : anchor;
  return <>
    <ButtonBase
      onClick={(event) => setAnchor(event.currentTarget)}
      aria-haspopup="dialog" aria-expanded={anchor !== null} aria-controls={anchor ? popoverId : undefined}
      aria-label={`${t('rounds.label')}: ${otherName}, ${otherStatus}`}
      // The phone's header leaves its side columns about 80px: the marker
      // goes above the name, so a long name still fits.
      sx={{
        ...(props.compact
          ? { flexDirection: 'column', minHeight: 44, minWidth: 44, gap: '3px', padding: '4px 6px', borderRadius: '12px' }
          : { height: 36, minWidth: 0, gap: '8px', padding: '0 8px 0 12px', borderRadius: '999px' }),
        border: `1px solid ${alpha(contrast, anchor ? 1 : 0.5)}`,
        backgroundColor: anchor ? alpha(contrast, 0.14) : 'transparent',
        color: contrast, fontFamily: 'inherit', fontSize: 13, whiteSpace: 'nowrap',
        '&:hover': { borderColor: contrast, backgroundColor: alpha(contrast, 0.12) },
      }}>
      <RoundMarker round={other} onDark/>
      {props.compact
        ? <Box component="span" sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherName}</Box>
        : <Box component="span"><b>{otherName}:</b> {otherStatus}</Box>}
      {!props.compact && <KeyboardArrowDownRounded aria-hidden sx={{
        fontSize: 18, transition: 'transform 150ms', transform: anchor ? 'rotate(180deg)' : 'none',
      }}/>}
    </ButtonBase>
    <Popover
      id={popoverId}
      open={anchor !== null}
      anchorEl={header}
      onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: props.compact ? 'left' : 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: props.compact ? 'left' : 'right' }}
      marginThreshold={props.compact ? 0 : 16}
      slotProps={{
        backdrop: { invisible: !props.compact },
        paper: {
          role: 'dialog', 'aria-label': t('rounds.label'),
          sx: props.compact
            ? { width: '100%', maxWidth: '100%', borderRadius: '0 0 20px 20px', padding: '16px 20px 18px' }
            : { width: 330, marginTop: '8px', borderRadius: '14px', padding: '14px 18px 16px', boxShadow: '0 12px 32px rgba(0,0,0,.18)' },
        },
      }}
    >
      <RoundsList view={props.view}/>
    </Popover>
  </>;
}
