import { Box, Button } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { useBoardKeys } from '../../../common/board-keys';
import { PHASE } from '../../../common/gamewrapper';
import { JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { BOARD_SIZE, isLegalPlacement, winningLine } from './game';
import type { MyGameState } from './game';


type MyGameProps = BoardProps<MyGameState & GameStateMixin>;

export function MyBoard({ G, ctx, moves, isActive }: MyGameProps) {
  // The bot's marks of its latest turn, the first as soon as it lands.
  const machineMove = G.lastMachineMove ?? [];
  const active = isActive && ctx.phase === PHASE.play && !ctx.gameover && G.winner === null;
  const line = winningLine(G.cells);
  // The team's first X of a turn stands out until the second ends the turn.
  const xsThisTurn = ctx.currentPlayer === JUDGE_PLAYER ? [] : G.xsThisTurn ?? [];
  const keys = useBoardKeys({ active, columns: BOARD_SIZE });

  const chooseCell = (index: number) => {
    if (active && isLegalPlacement(G, ctx, index)) moves.placeMark(index);
  };

  return (
    // The marks scale with the board, not the window, so a board narrowed to
    // fit a short window keeps square cells.
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto', containerType: 'inline-size' }}>
      <Box role="group" aria-label="5 × 5-ös játéktábla" {...keys} sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
        {G.cells.map((cell, index) => (
          <Button
            key={index}
            variant='outlined'
            disabled={!active || cell !== null}
            aria-label={`${Math.floor(index / BOARD_SIZE) + 1}. sor, ${index % BOARD_SIZE + 1}. oszlop: ${cell === 'O' ? 'kör' : cell === 'X' ? (xsThisTurn.includes(index) ? 'az imént letett X' : 'X') : 'üres'}`}
            onClick={() => chooseCell(index)}
            sx={{
              minWidth: 0, p: 0, aspectRatio: '1', fontSize: 'clamp(16px, 9cqi, 40px)', lineHeight: 1,
              borderWidth: 2, borderRadius: 1,
              ...(machineMove.includes(index) && {
                bgcolor: 'color-mix(in srgb, currentColor 20%, transparent)',
              }),
              '&.Mui-disabled': { color: 'primary.main', borderColor: 'divider' },
              // MUI's own disabled style sets the border's width, so this does too.
              ...(xsThisTurn.includes(index) && {
                '&.Mui-disabled': { color: 'primary.main', borderColor: 'primary.main', borderWidth: 3 },
              }),
              ...(line.includes(index) && {
                bgcolor: 'primary.main',
                '&.Mui-disabled': { color: 'primary.contrastText', borderColor: 'primary.main' },
              }),
            }}
          >
            {cell ?? '\u00a0'}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
