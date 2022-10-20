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
          Kedves Versenyző!<br/>
          Üdvözlünk a XVI. Dürer Verseny online fordulójának felületén.
        </Stack>
        <Stack sx={{
          marginTop: "15px",
          fontSize: "30px",
        }}>
          Belépéshez nézd meg az emailjeidet, nyisd meg az ott található linket vagy üsd be a kódot ide:
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
              placeHolder="111-2222-333"
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
      <Stack sx={{fontSize: 14, paddingTop: "100px"}}>
        Ha nem találjátok az emailt, akkor írjatok nekünk a durerinfo@gmail.com email címre.
      </Stack>
    </Stack>
  )
}