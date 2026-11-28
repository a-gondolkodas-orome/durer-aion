import { Box, Button, Stack } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { useBoardKeys } from '../../../common/board-keys';
import { PHASE } from '../../../common/gamewrapper';
import { botMovedLast } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { isLegalTake, TAKES } from './game';
import type { MyGameState } from './game';

type MyGameProps = BoardProps<MyGameState & GameStateMixin>;

// The board has no words of its own, so it serves both of the game's
// languages: the pile's size and the takes are numbers, and the rules text the
// wrapper shows beside it says what they mean.
export function MyBoard({ G, ctx, moves, isActive }: MyGameProps) {
  const active = isActive && ctx.phase === PHASE.play && !ctx.gameover && G.winner === null;
  // What the bot just took stays beside the pile, faded, with its take.
  const justTaken = botMovedLast(G, ctx) ? G.lastJudgeTake ?? 0 : 0;
  // Every board is played from the keyboard too: the arrows choose, Enter moves.
  const keys = useBoardKeys({ active });

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: 440, mx: 'auto' }}>
      <Box sx={{ fontSize: 48, fontWeight: 'bold', lineHeight: 1 }}>{G.pile}</Box>
      <Box aria-hidden sx={{ letterSpacing: 2, textAlign: 'center', wordBreak: 'break-all' }}>
        {'●'.repeat(G.pile)}
        <Box component="span" sx={{ opacity: 0.3 }}>{'○'.repeat(justTaken)}</Box>
        {justTaken > 0 && <Box component="span" sx={{ ml: 1, color: 'text.secondary', letterSpacing: 0 }}>{`−${justTaken}`}</Box>}
      </Box>
      <Stack direction="row" spacing={1} {...keys}>
        {TAKES.map(count => (
          <Button key={count} variant="contained" disabled={!active || !isLegalTake(G, ctx, count)} onClick={() => moves.take(count)}>
            {`−${count}`}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
