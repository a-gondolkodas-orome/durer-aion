import { Stack } from '@mui/system';
import { FinishedMatchStatus } from '../../../server/entities/model';
import { TeamModelDto } from '../../dto/TeamStateDto';


/**
 * This component is used, when all interactions are finished with the user, and only the results are summarised.
 * Contains some primitive logic, to aggregate the points, and creates a stack of mui components to display these
 * @param props {{state: TeamModelDto}} (The null potion should be handled earlier, but it is not)
 * @returns Aggregated point visualisations
 */
export function Finished(props: {state: TeamModelDto | null}) {
  if(props.state === null)
    //TODO: fix this
    throw new Error("teamState is null, and it was not properly handled earlier.")
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
        // TODO: add additional metrics
        {stratScore + relayScore} <span style={{fontSize: '16px', color: '#000', marginLeft: '5px'}}>pont</span>
      </Stack>

    </Stack>
  )
}