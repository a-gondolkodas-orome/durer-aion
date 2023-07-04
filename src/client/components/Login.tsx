import { Stack } from '@mui/system';
import { Field } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import theme from './theme';

export function Login() {
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin()

  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      maxWidth: 600,
    }}>
      <Stack sx={{
        marginTop: "80px",
      }}>
        <Stack sx={{
          fontSize: "40px",
        }}>
          Üdvözlünk a XVI. Dürer Verseny online fordulójának stratégiás játék felületén.
        </Stack>
        <Stack sx={{
          marginTop: "15px",
          fontSize: "20px",
        }}>
          Itt ki tudjátok próbálni a stratégiás játékot.
          Belépéshez üsd be valamelyik kategória betűjét (C, D vagy E), majd egy jeligét.
        </Stack>
        <Stack>
          <Form style={{ position: "relative", zIndex: 2 }} initialValues={{ joinCode: '' }}
            onSubmit={(values) => {
              if(!values.joinCode) {
                enqueueSnackbar("nem adtad meg a kódot", { variant: 'error' });
                return;
              }
              const res = login(values.joinCode).catch(err => {
                enqueueSnackbar(err?.message, { variant: 'error' });
              });
            }}>
            <Field 
              name="joinCode"
              type="text"
              placeholder="CDürer"
              style={{
                width: '250px',
                height: '40px',
                borderWidth: '2px',
                borderRadius: '5px',
                borderColor: theme.palette.primary.main,
                fontSize: '18px',
              }}
            />
          </Form>
        </Stack>
      </Stack>
      <Stack sx={{fontSize: 18, paddingTop: "100px"}}>
        Pl. ha azt a jeligét választod, hogy "Dürer" és C kategóriás játékkal szeretnél játszani, akkor üsd be azt, hogy "CDürer".
      </Stack>
    </Stack>
  )
}