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
          Váltóversenyek gyakorlása
        </Stack>
        <Stack sx={{
          marginTop: "15px",
          fontSize: "30px",
        }}>
          <p>Ki tudjátok próbálni a korábbi évek versenyeit. Válaszd ki a megfelelő feladatsort, utána 90 perced van kitölteni a feladatsort.</p>
        </Stack>
        <Stack>
          <SelectProblem />
        </Stack>
      </Stack>
    </Stack>
  )
}