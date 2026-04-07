import React, { useEffect, useState } from "react";
import * as Yup from 'yup';
import { Button, Stack } from "@mui/material";
import Form from "./form";
import { ErrorMessage, Field } from "formik";
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
  previousCorrectness: Boolean | null;
  onSubmit: (result: any) => void;
  attempt: number;
}

export const ExcerciseForm: React.FunctionComponent<MyProps> = (props: MyProps) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const refreshState = useRefreshTeamState();
  const [sentAnswer, setSentAnswer] = useState<number>(0);
  const { t } = useTranslation(undefined, { keyPrefix: 'relay' });
  useEffect(()=>{
    if(props.previousCorrectness!=null){
      if(props.previousCorrectness){
        console.log(t('goodGuess'))
        enqueueSnackbar(t('goodGuess'), { variant: 'success' });
      } else {
        console.log(t('wrongGuess'))
        enqueueSnackbar(t('wrongGuess'), { variant: 'error' });
      }
    }
    setSentAnswer((p)=>{return p-1;});
  }, [props.previousCorrectness, props.attempt, enqueueSnackbar])
  return <Stack>
    <Stack sx={{
      fontSize: '22px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      marginBottom: '5px',
    }}>
      {t('guess')}
    </Stack>
    <Stack>
      <Form
        style={{ position: "relative", zIndex: 2 }}
        key={`result-${props.attempt}`}
        initialValues={{ result: '' }}
        validationSchema={Yup.object().shape({
          result: Yup.number()
            .integer(t('error.integer'))
            .typeError(t('error.type'))
            .min(0, t('error.range'))
            .max(9999, t('error.range'))
            .required(t('error.empty'))
        })}
        onSubmit={(values) => {
          if (props.previousTries.includes(parseInt(values.result))) {
            enqueueSnackbar(t('error.duplicate'), { variant: 'error' });
            return;
          }
          try{
            props.onSubmit(values.result)
            refreshState()
          } catch (e: any) {
            console.log(e)
            enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
            if (e?.message === "cannot make move after game end") {
              refreshState();
            }
          }
          setSentAnswer(1);
        }}>
        <Field
          name="result"
        >
        {
          ({
            field, 
            form: { handleChange },
          }: any) => <input
            autoFocus={sentAnswer>0}
            autoComplete="off"
            {...field}
            onChange={(e)=>{
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
        <ErrorMessage name="result" />
        <Stack sx={{marginTop: '20px'}}>
          {props.previousTries.map((data, idx) => {
            return <Stack sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              fontSize: 16,
            }}>
              {t('guessNum', { guessnum: idx + 1 })}
              <Stack sx={{
                fontSize: '18px',
                marginLeft: '10px',
              }}>{data}</Stack>
              {props.previousCorrectness === false && <CloseIcon sx={{ color: '#FF0000', fontSize: '18ox' }} />}
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
        }} variant='contained' color='primary' type="submit">
          {t('send')}
        </Button>
      </Form>
    </Stack>
  </Stack>
}