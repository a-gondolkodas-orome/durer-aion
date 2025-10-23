import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import Stack from '@mui/material/Stack';
import { Button, Typography, Box } from '@mui/material';
import { GUESSER_PLAYER } from '../../../common';

interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps, theme: any) {
  const currentPlayerLastFromLeft = G.lastMoveFromLeftByPlayer[GUESSER_PLAYER];
  const canTakeFromLeft = G.stonesLeft > 0 && !currentPlayerLastFromLeft;
  const canTakeFromRight = G.stonesRight > 0;

  return (
    <Stack sx={{
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: 3,
    }}>
      {/* Game State Display */}
      <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
        {/* Left Pile */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Bal kupac
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            justifyContent: 'center',
            minHeight: '60px',
            alignItems: 'center',
            padding: 2,
            border: currentPlayerLastFromLeft ? '3px solid red' : '2px solid gray',
            borderRadius: 2,
            backgroundColor: currentPlayerLastFromLeft ? '#ffebee' : '#f5f5f5',
            minWidth: '120px'
          }}>
            {Array.from({ length: G.stonesLeft }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#795548',
                  border: '2px solid #5d4037'
                }}
              />
            ))}
            {G.stonesLeft === 0 && (
              <Typography variant="body2" color="textSecondary">Üres</Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ marginTop: 1 }}>
            {G.stonesLeft} kő
          </Typography>
        </Box>

        {/* Right Pile */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Jobb kupac
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            justifyContent: 'center',
            minHeight: '60px',
            alignItems: 'center',
            padding: 2,
            border: '2px solid gray',
            borderRadius: 2,
            backgroundColor: '#f5f5f5',
            minWidth: '120px'
          }}>
            {Array.from({ length: G.stonesRight }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#607d8b',
                  border: '2px solid #455a64'
                }}
              />
            ))}
            {G.stonesRight === 0 && (
              <Typography variant="body2" color="textSecondary">Üres</Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ marginTop: 1 }}>
            {G.stonesRight} kő
          </Typography>
        </Box>
      </Stack>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2}>
        <Button 
          variant='contained'
          color='primary' 
          disabled={ctx.phase !== 'play' || !canTakeFromLeft || ctx.currentPlayer !== GUESSER_PLAYER} 
          onClick={() => moves.takeStone(true)}
          sx={{ minWidth: '150px' }}
        >
          Vedd el balról
          {!canTakeFromLeft && G.stonesLeft > 0 && (
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7em' }}>
              (Nem ismételhető)
            </Typography>
          )}
        </Button>
        
        <Button 
          variant='contained' 
          color='primary'
          disabled={ctx.phase !== 'play' || !canTakeFromRight || ctx.currentPlayer !== GUESSER_PLAYER} 
          onClick={() => moves.takeStone(false)}
          sx={{ minWidth: '150px' }}
        >
          Vedd el jobbról
        </Button>
      </Stack>
    </Stack>
  )
}
