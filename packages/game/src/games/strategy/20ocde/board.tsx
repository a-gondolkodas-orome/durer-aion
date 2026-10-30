//cspell:ignore törölhetitek
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
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

// Remount a pending selection after a move, reload, role choice or new round.
export function MyBoard(props: MyGameProps) {
  const { G, ctx, matchID } = props;
  const positionKey = `${matchID}:${ctx.turn}:${ctx.phase}:${G.firstPlayer}:${G.numberOfTries}:${G.cells.join('-')}`;
  return <BoardTurn key={positionKey} {...props} machineMove={lastMachineMove(props)} />;
}

function BoardTurn({ G, ctx, moves, isActive, playerID, machineMove }: MyGameProps & { machineMove: number[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const active = isActive && ctx.phase === 'play' && !ctx.gameover && G.winner === null;
  const mark = markForPlayer(G, ctx.currentPlayer);
  const line = winningLine(G.cells);
  const ownMark = G.firstPlayer === null || playerID === null ? null : markForPlayer(G, playerID);

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

  let instruction = 'Válasszatok próba- vagy éles játékot!';
  if (ctx.phase === 'chooseRole') instruction = G.category === 'C'
    ? 'Válasszatok szerepet: a kezdő X-eket, a második köröket tesz le.'
    : 'Válasszatok szerepet: a kezdő köröket, a második X-eket tesz le.';
  if (ctx.phase === 'play') {
    instruction = !active ? 'A gép lép.' : mark === 'O'
      ? 'Tegyetek egy kört egy üres mezőre!'
      : selected === null ? 'Jelöljétek ki az első X helyét!'
        : 'Válasszátok ki a második X helyét! A kijelölt mezőre kattintva törölhetitek a kijelölést.';
  }
  if (G.winner !== null) instruction = markForPlayer(G, G.winner) === 'O' ? 'A körökkel játszó játékos nyert.' : 'Az X-ekkel játszó játékos nyert.';

  return (
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
      {ownMark !== null && <Typography sx={{ mb: 1 }}>Ti {ownMark === 'O' ? 'körökkel (○)' : 'X-ekkel'} játszotok.</Typography>}
      <Typography role="status" sx={{ mb: 2, minHeight: '3em' }}>{instruction}</Typography>
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
              minWidth: 0, p: 0, aspectRatio: '1', fontSize: 'clamp(24px, 6vw, 40px)',
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
