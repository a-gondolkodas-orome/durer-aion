import { Stack } from '@mui/system';
import { FinishedMatchStatus } from '../../../server/entities/model';
import { TeamModelDto } from '../../dto/TeamStateDto';

export function Finished(props: {state: TeamModelDto}) {
  const relayScore = (props.state.relayMatch as FinishedMatchStatus).score;
  const stratScore = (props.state.strategyMatch as FinishedMatchStatus).score;
  return (
    <Stack sx={{
      display: 'flex',
      width: '550px',
      height: '500px',
      borderRadius: '30px',
      padding: '30px',
      backgroundColor: "#fff",
      marginTop: "30px",
    }}>
      <Stack sx={{
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '30px',
      }}>
        Vége a játéknak
      </Stack>
      <Stack sx={{
        fontSize: 18,
        marginBottom: '20px',
      }}>
        Az elért pontszámotok
      </Stack>
      <Stack sx={{
        fontSize: 80,
        marginLeft: "200px",
        color: '#982000',
        flexDirection: 'row',
        alignItems: 'baseline',
      }}>
        {stratScore + relayScore} <span style={{fontSize: '16px', color: '#000', marginLeft: '5px'}}>pont</span>
      </Stack>

    </Stack>
  )
}