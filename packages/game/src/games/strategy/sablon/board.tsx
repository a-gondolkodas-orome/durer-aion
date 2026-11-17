import { Box, Button, Stack } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { PHASE } from '../../../common/gamewrapper';
import type { GameStateMixin } from '../../../common/types';
import { isLegalTake, TAKES } from './game';
import type { MyGameState } from './game';

type MyGameProps = BoardProps<MyGameState & GameStateMixin>;

// The board has no words of its own, so it serves both of the game's
// languages: the pile's size and the takes are numbers, and the rules text the
// wrapper shows beside it says what they mean.
export function MyBoard({ G, ctx, moves, isActive }: MyGameProps) {
  const active = isActive && ctx.phase === PHASE.play && !ctx.gameover && G.winner === null;
  const justTaken = active ? G.lastJudgeTake ?? 0 : 0;

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: 440, mx: 'auto' }}>
      <Box sx={{ fontSize: 48, fontWeight: 'bold', lineHeight: 1 }}>{G.pile}</Box>
      <Box aria-hidden sx={{ letterSpacing: 2, textAlign: 'center', wordBreak: 'break-all' }}>
        {'●'.repeat(G.pile)}
        <Box component="span" sx={{ opacity: 0.3 }}>{'○'.repeat(justTaken)}</Box>
      </Box>
      <Stack direction="row" spacing={1}>
        {TAKES.map(count => (
          <Button key={count} variant="contained" disabled={!active || !isLegalTake(G, ctx, count)} onClick={() => moves.take(count)}>
            {`−${count}`}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
