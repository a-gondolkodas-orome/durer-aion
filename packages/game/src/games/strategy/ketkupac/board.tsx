import { Box, Button, Stack } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { useEffect, useRef } from 'react';
import { useBoardKeys } from '../../../common/board-keys';
import { PHASE } from '../../../common/gamewrapper';
import type { GameStateMixin } from '../../../common/types';
import { isLegalSelection, isLegalTake, maxTake } from './game';
import type { MyGameState } from './game';

type MyGameProps = BoardProps<MyGameState & GameStateMixin>;

export function MyBoard({ G, ctx, moves, isActive }: MyGameProps) {
  const playing = ctx.phase === PHASE.play && !ctx.gameover && G.winner === null;
  const active = isActive && playing;
  // The bot's choice shows too, between the two moves of its turn, but not
  // once the game is over: a game timed out mid-turn keeps its pile chosen.
  const selected = playing ? G.selectedPile : null;
  const keys = useBoardKeys({ active });
  // A pile chosen, the keyboard goes on to how many to take from it.
  const takes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && selected !== null) takes.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
  }, [active, selected]);
  const most = !active || selected === null ? 0 : Math.min(maxTake(G, ctx.currentPlayer), G.piles[selected]);

  return (
    <Stack spacing={2} {...keys} sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
      {G.piles.map((size, pile) => {
        const justTaken = G.lastJudgeTake?.pile === pile ? G.lastJudgeTake.count : 0;
        return (
          <Button
            key={pile}
            variant={selected === pile ? 'contained' : 'outlined'}
            disabled={!isLegalSelection(G, ctx, pile) || !active}
            aria-label={`${pile + 1}. kupac: ${size} korong${justTaken > 0 ? `, a gép az imént ennyit vett el belőle: ${justTaken}` : ''}`}
            aria-pressed={selected === pile}
            onClick={() => moves.selectPile(pile)}
            sx={{
              justifyContent: 'flex-start', gap: 1, minHeight: 56, flexWrap: 'wrap', textTransform: 'none',
              // On the bot's turn every pile is disabled, and MUI greys a
              // disabled button: its chosen pile keeps the colour of a choice.
              ...(selected === pile && { '&.Mui-disabled': { color: 'primary.contrastText', backgroundColor: 'primary.main' } }),
            }}
          >
            <Box component="span" sx={{ fontWeight: 'bold', minWidth: '2.5em' }}>{size}</Box>
            <Box component="span" aria-hidden sx={{ letterSpacing: 2 }}>
              {'●'.repeat(size)}
              <Box component="span" sx={{ opacity: 0.3 }}>{'○'.repeat(justTaken)}</Box>
            </Box>
          </Button>
        );
      })}
      <Stack ref={takes} direction="row" spacing={1} sx={{ justifyContent: 'center', minHeight: 40 }}>
        {selected !== null && Array.from({ length: most }, (_, i) => i + 1).map(count => (
          <Button
            key={count}
            variant="contained"
            disabled={!isLegalTake(G, ctx, selected, count)}
            aria-label={`${count} korong elvétele`}
            onClick={() => moves.take(selected, count)}
          >
            {`−${count}`}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
