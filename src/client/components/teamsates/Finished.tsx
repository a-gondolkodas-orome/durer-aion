import { Stack } from '@mui/system';

export function Finished(props: {score: number}) {
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
        Vége a feladatnak
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
        {props.score} <span style={{fontSize: '16px', color: '#000', marginLeft: '5px'}}>pont</span>
      </Stack>

    </Stack>
  )
}