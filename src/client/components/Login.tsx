import { Stack } from '@mui/system';
import { Field } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import theme from './theme';
import SelectProblem from './SelectProblem';
import { Button, Select } from '@mui/material';

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
          Üdvözlünk a Dürer Verseny váltó gyakorló felületén.
        </Stack>
        <Stack sx={{
          marginTop: "15px",
          fontSize: "30px",
        }}>
          Itt ki tudjátok próbálni a korábbi évi váltó versenyeket.
          Válaszd ki a megfelelő feladatsort és lépj tovább.
        </Stack>
        <Stack>
          <SelectProblem />
        </Stack>
      </Stack>
    </Stack>
  )
}