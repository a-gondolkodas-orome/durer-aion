import { Button } from '@mui/material';
import { Stack } from '@mui/system';

export function ChooserItem(props: {setStarted: React.Dispatch<string>, type: 'strategias'|'relay' }) {
  return (
    <Stack sx={{
      display: 'flex',
      width: 'calc(50% - 50px)',
      padding: "40px",
      backgroundColor: "#fff",
    }}>
      <Stack sx={{
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center',
      }}>
        {props.type=='relay' ? "Váltófeladatok" : "Stratégiás játék"}
      </Stack>
      {props.type == 'relay' &&
        <Stack sx={{
          fontSize: 14,
          height: "100%",
          display: 'flex',
          alignItems: "center",
          flexDirection: 'row',
        }}>
          <Stack>
            A váltófeladatok rövid szöveges feladatok, melyekre a válasz egy egész szám (legalább 0 és legfeljebb 9999). Minden váltófeladatra maximum 3 tippet adhattok le, egy-egy rossz tipp után az adott feladatra megszerezhető pontszám 1-gyel csökken. Helyes tipp vagy három rossz tipp után megkapjátok a következő feladatot. A váltófeladatokra összesen 60 perc áll rendelkezésre, és összesen 40 pont szerezhető velük hibátlan teljesítés esetén. (Az egyes feladatokra kapható pontszám 3-tól 6-ig terjed.)
          </Stack>
        </Stack>
      }        
      {props.type == 'strategias' &&
        <Stack sx={{
          fontSize: 14,
          height: "100%",
          paddingBottom: "10px",
          "& p": {
            marginBlockEnd: 0,
          },
        }}>
          <p>Ebben a feladatban egy kétszemélyes stratégiás játékot játszhattok, ahol az egyik játékos Ti lesztek, a másik játékos pedig a gép. Győzzétek le a gépet <b>kétszer egymás</b> után ebben a játékban! A kezdő helyzet ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek bújni.</p>         
          <p>A sikeres teljesítésért az alábbiak szerint kaptok pontot:
            <ul>
              <li>Ha egyszer sem veszítetek, akkor 12 pontot kaptok.</li>
              <li>1, 2, 3, 4, illetve 5 vereség esetén a kapott pontszám 9-re, 6-ra, 4-re, 3-ra, illetve 2-re csökken.</li>
              <li>Ennél több vereség esetén is 2 pontot kaptok, ha sikerül teljesítenetek a játékot.</li>
              <li>Ha 30 perc alatt nem győzitek le kétszer egymás után a gépet, akkor 0 pontot kaptok.</li>
            </ul>
          </p>
          <p>
            Ha készen álltok, kattintsatok a lenti gombra és onnantól kezdve összesen 30 perc áll rendelkezésetekre.
          </p>
        </Stack>
      }  
      <Button sx={{
        width: '100%',
        height: '75px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={()=>{
        props.setStarted(props.type)
      }}>
        Kezdjük
      </Button>
    </Stack>
  )
}