import { Stack } from '@mui/system';
import { Field } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import theme from './theme';
import { dictionary } from '../text-constants';

export function Login() {
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin()

  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      maxWidth: 600,
    }} data-testId="loginRoot">
      <Stack sx={{
        marginTop: "80px",
      }}>
        <Stack sx={{
          fontSize: "40px",
        }}>
          {dictionary.login.greeting}<br/>
          {dictionary.login.beforeTitle} {dictionary.header.title} {dictionary.login.afterTitle}
        </Stack>
        <Stack sx={{
          marginTop: "15px",
          fontSize: "30px",
        }}>
          {dictionary.login.loginInstraction}
        </Stack>
        <Stack>
          <Form style={{ position: "relative", zIndex: 2 }} initialValues={{ joinCode: '' }}
            onSubmit={(values) => {
              if(!values.joinCode) {
                enqueueSnackbar("nem adtad meg a kódot", { variant: 'error' });
                return;
              }
              login(values.joinCode).catch(err => {
                enqueueSnackbar(err?.message, { variant: 'error' });
              });
            }}>
            <Field 
              name="joinCode"
              type="text"
              placeholder="111-2222-333"
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
        {dictionary.login.loginInstraction}
      </Stack>
    </Stack>
  )
}