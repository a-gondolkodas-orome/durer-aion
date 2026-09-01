import { Stack } from '@mui/system';
import { Field, type FieldProps } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import * as reactTextMask from "react-text-mask";

// react-text-mask's 2018 UMD build assigns __esModule at runtime, where
// Vite 8's rolldown prebundle cannot see it, so a plain default import hands
// this component to React as the raw CJS exports object and the login form
// crashes. Unwrap however many .default layers the bundler of the day adds.
const unwrapDefault = (mod: unknown): unknown => {
  let current = mod;
  while (
    current &&
    typeof current !== "function" &&
    (current as { default?: unknown }).default !== undefined
  ) {
    current = (current as { default: unknown }).default;
  }
  return current;
};
const MaskedInput = unwrapDefault(reactTextMask) as typeof reactTextMask.default;
import { useTranslation } from 'react-i18next';

const idMask = [/\d/, /\d/,  /\d/, "-", /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/ ];

export function Login() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const { t } = useTranslation();

  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      maxWidth: 600,
      paddingLeft: {
        xs: '10px',
        lg: 0
      },
      paddingRight: {
        xs: '10px',
        md: 0
      },
      marginTop: {
        xs: "10px",
        md: "0px",
      },
    }} data-testid="loginRoot">
      <Stack sx={{
        marginTop: {
          sx: "25px",
          md: "80px",
        },
      }}>
        <Stack sx={{
          fontSize: {
            xs: "25px",
            md: "40px",
          }
        }}>
          {t('login.greeting')}<br/>
          {t('login.beforeTitle')}{t('header.title')}{t('login.afterTitle')}
        </Stack>
        <Stack sx={{
          marginTop: {
            sx: "7px",
            md: "15px",
          },
          fontSize: {
            sx: "15px",
            md: "30px",
          }
        }}>
          {t('login.loginInstruction')}
        </Stack>
        <Stack>
          <Form style={{ position: "relative", zIndex: 2 }} initialValues={{ joinCode: '' }}
            onSubmit={(values) => {
              if (!values.joinCode) {
                enqueueSnackbar(t('login.error.empty'), { variant: 'error' });
                return;
              }
              login(values.joinCode).catch((err: unknown) => {
                // A rejection that is not an Error has no `message`, and the snackbar
                // then shows an empty box where the reason should be.
                enqueueSnackbar(err instanceof Error ? err.message : t('error.unexpected'), { variant: 'error' });
              });
            }}>
            <Field
              name="joinCode"
              type="text"
            >

        {
          ({
            field,
            form: { handleChange },
          }: FieldProps) => <MaskedInput
            {...field}
            mask={idMask}
            onChange={handleChange}
            className="text-input"
              placeholder="111-2222-333"
              style={{
                width: '300px',
                height: '40px',
                borderWidth: '2px',
                borderRadius: '5px',
                borderColor: theme.palette.primary.main,
                fontSize: '18px',
              }}
          />
        }
            </Field>
            <Button
              type="submit"
              color='primary'
              variant='contained'
              sx={{
                width: {
                  xs: '300px',
                  sm: '250px',
                },
                height: '40px',
                borderRadius: '5px',
                fontSize: '18px',
                marginTop: {
                  xs: '10px',
                  sm: '0px'
                },
                marginLeft: {
                  xs: '0px',
                  sm: '10px'
                }
              }}
            >
              {t('login.loginButton')}
            </Button>
          </Form>
        </Stack>
      </Stack>
      <Stack sx={{
        fontSize: {
          xs: 11,
          md: 14,
        },
         paddingTop: {
          xs: "20px",
          md: "100px"
        } }}>
        {t('login.fallback')}
      </Stack>
    </Stack>
  )
}
