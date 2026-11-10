import { Stack } from '@mui/system';
import { Field, type FieldProps } from 'formik';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';
import Form from './form';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import * as reactTextMask from "react-text-mask";
import { cardTokens } from './card';

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
import { useId } from 'react';

const idMask = [/\d/, /\d/,  /\d/, "-", /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/ ];

export function Login() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const { t } = useTranslation();
  const codeId = useId();

  return (
    <Stack data-testid="loginRoot">
      {/* The greeting a small line over the title, and the instruction plain
          text: what the page asks of a team is the field below them. */}
      <Stack sx={{
        fontSize: { xs: 14, sm: 16 },
        fontWeight: 600,
        color: theme.palette.primary.main,
      }}>
        {t('login.greeting')}
      </Stack>
      <Stack component="h1" sx={{
        margin: '6px 0 0',
        fontSize: { xs: 22, sm: 30 },
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}>
        {t('login.beforeTitle')}{t('header.title')}{t('login.afterTitle')}
      </Stack>
      <Stack sx={{
        marginTop: '12px',
        fontSize: { xs: 15, sm: 17 },
        lineHeight: 1.5,
        color: cardTokens(theme).bodyText,
      }}>
        {t('login.loginInstruction')}
      </Stack>
      <Stack sx={{ mt: 3 }}>
        <Form initialValues={{ joinCode: '' }}
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
          {/* Wrapped, the button goes under the field at the field's width;
              side by side, it takes what the card has left, level with the
              field rather than its label. */}
          <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <Stack sx={{ gap: '6px', width: '300px', maxWidth: '100%' }}>
            <Stack component="label" htmlFor={codeId} sx={{ fontSize: 14, fontWeight: 600 }}>
              {t('login.codeLabel')}
            </Stack>
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
            id={codeId}
            mask={idMask}
            onChange={handleChange}
            className="text-input"
              placeholder="111-2222-333"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: '48px',
                padding: '0 14px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderRadius: cardTokens(theme).controlRadius,
                outlineColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                fontSize: '18px',
                // The code is read off an email: each digit apart, and the
                // same width, so a mistyped one shows.
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                letterSpacing: '0.08em',
              }}
          />
        }
            </Field>
            </Stack>
            <Button
              type="submit"
              color='primary'
              variant='contained'
              sx={{
                flex: '1 1 250px',
                maxWidth: '300px',
                height: '48px',
                borderRadius: cardTokens(theme).controlRadius,
                fontSize: '18px',
                fontWeight: 600,
                textTransform: 'none',
              }}
              disableElevation
            >
              {t('login.loginButton')}
            </Button>
          </Stack>
        </Form>
      </Stack>
      <Stack sx={{
        fontSize: {
          xs: 11,
          sm: 14,
        },
        paddingTop: {
          xs: "20px",
          sm: "40px"
        } }}>
        {t('login.fallback')}
      </Stack>
    </Stack>
  )
}
