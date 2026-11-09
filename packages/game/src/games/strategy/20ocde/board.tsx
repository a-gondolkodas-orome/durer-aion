import { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import type { BoardProps } from 'boardgame.io/react';
import { JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { BOARD_SIZE, isLegalPlacement, markForPlayer, winningLine } from './game';
import type { MyGameState } from './game';


/// What the board holds of the team's move before sending it: whether a first X
/// is picked. It reports it with `setTurnState`, for the step description in
/// main.tsx to read; the practice site's 5×5 game words its steps the same way.
export interface TurnState {
  xsPlaced: 0 | 1;
}

type MyGameProps = BoardProps<MyGameState & GameStateMixin> & {
  setTurnState?: (turnState: TurnState) => void,
};

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

// Remount a pending selection after a move, reload, role choice or new round.
export function MyBoard(props: MyGameProps) {
  const { G, ctx, matchID } = props;
  const positionKey = `${matchID}:${ctx.turn}:${ctx.phase}:${G.firstPlayer}:${G.numberOfTries}:${G.cells.join('-')}`;
  return <BoardTurn key={positionKey} {...props} machineMove={lastMachineMove(props)} />;
}

function BoardTurn({ G, ctx, moves, isActive, machineMove, setTurnState }: MyGameProps & { machineMove: number[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    setTurnState?.({ xsPlaced: selected === null ? 0 : 1 });
  }, [selected, setTurnState]);
  const active = isActive && ctx.phase === 'play' && !ctx.gameover && G.winner === null;
  const mark = markForPlayer(G, ctx.currentPlayer);
  const line = winningLine(G.cells);

  const chooseCell = (index: number) => {
    if (!active || G.cells[index] !== null) return;
    if (selected === index) {
      setSelected(null);
      return;
    }
    const indices = selected === null ? [index] : [selected, index];
    if (isLegalPlacement(G, ctx, indices)) {
      moves.placeMarks(indices);
      setSelected(null);
    } else if (mark === 'X') {
      setSelected(index);
    }
  };

  return (
    // The marks scale with the board, not the window, so a board narrowed to
    // fit a short window keeps square cells.
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto', containerType: 'inline-size' }}>
      <Box role="group" aria-label="5 × 5-ös játéktábla" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
        {G.cells.map((cell, index) => (
          <Button
            key={index}
            variant={selected === index ? 'contained' : 'outlined'}
            disabled={!active || cell !== null}
            aria-pressed={selected === index}
            aria-label={`${Math.floor(index / BOARD_SIZE) + 1}. sor, ${index % BOARD_SIZE + 1}. oszlop: ${cell === 'O' ? 'kör' : cell ?? (selected === index ? 'kijelölt X' : 'üres')}`}
            onClick={() => chooseCell(index)}
            sx={{
              minWidth: 0, p: 0, aspectRatio: '1', fontSize: 'clamp(16px, 9cqi, 40px)', lineHeight: 1,
              borderWidth: 2, borderRadius: 1,
              ...(machineMove.includes(index) && {
                bgcolor: 'color-mix(in srgb, currentColor 20%, transparent)',
              }),
              '&.Mui-disabled': { color: 'primary.main', borderColor: 'divider' },
              ...(line.includes(index) && {
                bgcolor: 'primary.main',
                '&.Mui-disabled': { color: 'primary.contrastText', borderColor: 'primary.main' },
              }),
            }}
          >
            {cell ?? (selected === index ? 'X' : '\u00a0')}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
