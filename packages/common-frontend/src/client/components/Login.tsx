import { Stack } from '@mui/system';
import { Field } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import MaskedInput from "react-text-mask";
import { useTranslation } from 'react-i18next';

const idMask = [/\d/, /\d/,  /\d/, "-", /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/ ];

export function Login() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const { t } = useTranslation(undefined, { keyPrefix: 'login' });

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
    }} data-testId="loginRoot">
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
          {t('greeting')}<br/>
          {t('beforeTitle')}{t('title', { keyPrefix: 'header' })}{t('afterTitle')}
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
          {t('loginInstruction')}
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
            >

        {
          ({
            field, 
            form: { handleChange },
          }: any) => <MaskedInput
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
              {t('loginButton')}
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
        }}}>
        {t('fallback')}
      </Stack>
    </Stack>
  )
}