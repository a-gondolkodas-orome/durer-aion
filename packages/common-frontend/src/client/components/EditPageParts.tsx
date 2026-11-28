import { Box, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { type ReactNode, useEffect, useRef } from 'react';
import { BORDER, DANGER, DANGER_BORDER, MUTED } from './adminStyles';

// What the admin page's edit pages share.

export const WARNING = '#7a4b00';
export const WARNING_BORDER = '#f0d49a';

/** Warns on leaving the page while `dirty`. Set the ref just before a save
 *  navigates away, which comes before the render that clears `dirty`. */
export function useLeaveWarning(dirty: boolean) {
  const leaving = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (!leaving.current) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); };
  }, [dirty]);
  return leaving;
}

export function Steps({ names, step }: { names: readonly string[], step: number }) {
  return (
    <Stack component="ol" aria-label="Lépések" sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '28px', margin: 0,
      padding: 0, listStyle: 'none' }}>
      {names.map((name, index) => {
        const current = index + 1 === step;
        return (
          <Stack component="li" key={name} aria-current={current ? 'step' : undefined}
            sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '14px',
              color: current ? 'text.primary' : MUTED, fontWeight: current ? 500 : 400 }}>
            <Box component="span" sx={{ width: 26, height: 26, borderRadius: '13px', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '13px',
              backgroundColor: index + 1 <= step ? 'primary.main' : BORDER,
              color: index + 1 <= step ? 'primary.contrastText' : 'text.primary' }}>{index + 1}</Box>
            {name}
          </Stack>
        );
      })}
    </Stack>
  );
}

export function Card(props: { title: string, action?: ReactNode, children: ReactNode, tone?: 'danger' | 'warning' }) {
  const color = props.tone === 'danger' ? DANGER : props.tone === 'warning' ? WARNING : undefined;
  const border = props.tone === 'danger' ? DANGER_BORDER : props.tone === 'warning' ? WARNING_BORDER : BORDER;
  return (
    <Stack component="section" aria-label={props.title} sx={{ backgroundColor: '#fff', border: `1px solid ${border}`,
      borderRadius: '8px', padding: '24px', gap: '16px' }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        flexWrap: 'wrap' }}>
        <Typography component="h2" sx={{ fontSize: '17px', fontWeight: 600, color }}>{props.title}</Typography>
        {props.action}
      </Stack>
      {props.children}
    </Stack>
  );
}

export function MessageList({ messages }: { messages: string[] }) {
  return (
    <Box component="ul" sx={{ margin: 0, paddingLeft: '20px', fontSize: '14px', display: 'flex', flexDirection: 'column',
      gap: '6px' }}>
      {messages.map(message => <li key={message}>{message}</li>)}
    </Box>
  );
}

export function ReviewMessages({ errors, warnings }: { errors: string[], warnings: string[] }) {
  return <>
    {errors.length > 0 && <Card tone="danger" title={`${errors.length} hiba, ezek miatt még nem menthető`}>
      <MessageList messages={errors}/>
    </Card>}
    {warnings.length > 0 && <Card tone="warning" title={`${warnings.length} figyelmeztetés`}>
      <MessageList messages={warnings}/>
    </Card>}
  </>;
}
