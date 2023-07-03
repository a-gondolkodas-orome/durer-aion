import { Stack } from '@mui/system';
import { TeamModelDto } from '../dto/TeamStateDto';
import { ChooserItem } from './ChooserItem';

export function Chooser(props: {state: TeamModelDto}) {
  return (
    <Stack sx={{
      display: 'flex',
      width: '100%',
      margin: "40px",
      flexDirection: "row"
    }}>
      <ChooserItem status={props.state.relayMatch} type="relay" />
      <Stack sx={{width: "20px"}}/>
      <ChooserItem status={props.state.strategyMatch} type="strategias" />
    </Stack>
  )
}