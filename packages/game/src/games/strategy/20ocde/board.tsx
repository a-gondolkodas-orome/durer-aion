import { Box, Button } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { BOARD_SIZE, isLegalPlacement, markForPlayer, winningLine } from './game';
import type { MyGameState } from './game';


type MyGameProps = BoardProps<MyGameState & GameStateMixin>;

// Online state may come from a server without lastMachineMove. The move log
// also survives board remounts and reconnects, unlike local cell comparisons.
function lastMachineMove({ G, log }: MyGameProps): number[] {
  if (G.firstPlayer === null) return [];
  const machineMark = markForPlayer(G, JUDGE_PLAYER);
  for (let i = log.length - 1; i >= 0; i--) {
    const { action } = log[i];
    if (action.type !== 'MAKE_MOVE') continue;
    const { type, playerID, args } = action.payload;
    if (type === 'chooseNewGameType' || type === 'setStartingPosition' || type === 'chooseRole') return [];
    if (type !== 'placeMarks' || playerID !== JUDGE_PLAYER) continue;
    const indices: unknown = args?.[0];
    if (Array.isArray(indices)) {
      // A winning first X can end the move before the second is placed.
      return indices.filter((index: unknown): index is number =>
        typeof index === 'number' && Number.isInteger(index) && G.cells[index] === machineMark);
    }
  }
  return G.lastMachineMove ?? [];
}

export function MyBoard(props: MyGameProps) {
  const { G, ctx, moves, isActive } = props;
  const machineMove = lastMachineMove(props);
  const active = isActive && ctx.phase === 'play' && !ctx.gameover && G.winner === null;
  const line = winningLine(G.cells);
  // The team's first X of a turn stands out until the second ends the turn.
  const xsThisTurn = ctx.currentPlayer === JUDGE_PLAYER ? [] : G.xsThisTurn ?? [];

  const chooseCell = (index: number) => {
    if (active && isLegalPlacement(G, ctx, [index])) moves.placeMarks([index]);
  };

  return (
    // The marks scale with the board, not the window, so a board narrowed to
    // fit a short window keeps square cells.
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto', containerType: 'inline-size' }}>
      <Box role="group" aria-label="5 × 5-ös játéktábla" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
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
              '&.Mui-disabled': { color: 'primary.main', borderColor: xsThisTurn.includes(index) ? 'primary.main' : 'divider' },
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
