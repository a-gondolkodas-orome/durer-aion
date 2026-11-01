import React, { useEffect, useEffectEvent, useState } from "react";
import * as Yup from 'yup';
import { Button, Stack } from "@mui/material";
import Form from "./form";
import { ErrorMessage, Field, FieldProps } from "formik";
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from "notistack";
import { useRefreshTeamState } from "../hooks/user-hooks";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

function sanitizeValue(value: string) {
  const regex = /^([1-9]*[0-9]*)$/;
  if (regex.test(value)) {
    return true
  }
  return false;
}

export interface MyProps {
  previousTries: number[];
  previousCorrectness: boolean | null;
  onSubmit: (result: number) => Promise<void>;
  attempt: number;
  // Whether the previous guess is still waiting for the judge's ruling.
  awaitingJudge: boolean;
}

export const ExerciseForm: React.FunctionComponent<MyProps> = (props: MyProps) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const refreshState = useRefreshTeamState();
  // The form below remounts on each new attempt. Its input is focused only on
  // the attempt that follows a guess sent from this screen: a teammate's guess
  // must not raise the keyboard on this phone.
  const [pendingOwnGuessAt, setPendingOwnGuessAt] = useState<number | null>(null);
  const [focusAttempt, setFocusAttempt] = useState<number | null>(null);
  if (pendingOwnGuessAt !== null && pendingOwnGuessAt !== props.attempt) {
    setPendingOwnGuessAt(null);
    setFocusAttempt(props.attempt);
  }
  const { t } = useTranslation();
  // Awaited inside the try, so a handler that throws is reported like one that
  // rejects. The form does not wait for it: it resets right after the call.
  const sendAnswer = async (result: number) => {
    try {
      await props.onSubmit(result);
    } catch (e: unknown) {
      console.error(e);
      enqueueSnackbar(e instanceof Error ? e.message : t('error.unexpected'), { variant: 'error' });
      return;
    }
    void refreshState();
  };
  const announceResult = useEffectEvent((correct: boolean | null) => {
    if (correct != null) {
      if (correct) {
        enqueueSnackbar(t('relay.goodGuess'), { variant: 'success' });
      } else {
        enqueueSnackbar(t('relay.wrongGuess'), { variant: 'error' });
      }
    }
  });
  // The attempt is a dependency so that a second wrong guess in a row, which
  // leaves the correctness false, is announced too.
  useEffect(() => {
    announceResult(props.previousCorrectness);
  }, [props.previousCorrectness, props.attempt])
  return <Stack>
    <Stack sx={{
      fontSize: '22px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      marginBottom: '5px',
    }}>
      {t('relay.guess')}
    </Stack>
    <Stack>
      <Form
        key={`result-${props.attempt}`}
        initialValues={{ result: '' }}
        // The input is focused for you when a task arrives, so clicking away to
        // read it would otherwise report an empty guess before anyone has had a
        // chance to make one.
        validateOnBlur={false}
        validationSchema={Yup.object().shape({
          result: Yup.number()
            .integer(t('relay.error.integer'))
            .typeError(t('relay.error.type'))
            .min(0, t('relay.error.range'))
            .max(9999, t('relay.error.range'))
            .required(t('relay.error.empty'))
        })}
        onSubmit={(values) => {
          if (props.previousTries.includes(parseInt(values.result))) {
            enqueueSnackbar(t('relay.error.duplicate'), { variant: 'error' });
            return;
          }
          void sendAnswer(parseInt(values.result));
          setPendingOwnGuessAt(props.attempt);
        }}>
        <Field
          name="result"
        >
        {
          ({
            field,
            form: { handleChange },
          }: FieldProps<number>) => <input
            autoFocus={focusAttempt === props.attempt}
            // The ruling remounts the form, which would drop anything typed
            // while waiting for it.
            readOnly={props.awaitingJudge}
            autoComplete="off"
            {...field}
            onChange={(e) => {
                e.preventDefault();
                if (sanitizeValue(e.target.value)) {
                  handleChange(e);
                }
            }}
            className="text-input"
            style={{
              width: '100%',
              height: '40px',
              borderWidth: '2px',
              borderRadius: '5px',
              borderColor: theme.palette.primary.main,
              fontSize: '18px',
            }}
          />
        }</Field>
        {/* The message's line is reserved whether or not there is an error, so
            that validating an empty or malformed guess does not resize the
            panel the form sits in. */}
        <Stack sx={{ minHeight: '1.5em' }}>
          <ErrorMessage name="result" />
        </Stack>
        <Stack sx={{ marginTop: '20px' }}>
          {props.previousTries.map((data, idx) => {
            return <Stack key={idx} sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              fontSize: 16,
            }}>
              {t('relay.guessNum', { guessnum: idx + 1 })}
              <Stack sx={{
                fontSize: '18px',
                marginLeft: '10px',
              }}>{data}</Stack>
              {props.previousCorrectness === false && <CloseIcon sx={{ color: '#FF0000', fontSize: '18px' }} />}
            </Stack>
          })}
        </Stack>
        <Button sx={{
          width: '100%',
          height: '60px',
          fontSize: '26px',
          alignSelf: 'center',
          textTransform: 'none',
          borderRadius: '10px',
          marginTop: '40px',
        }} variant='contained' color='primary' type="submit" disabled={props.awaitingJudge}>
          {t('relay.send')}
        </Button>
      </Form>
    </Stack>
  </Stack>
}
