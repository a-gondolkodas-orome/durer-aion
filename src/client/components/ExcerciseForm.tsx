import React, { useEffect } from "react";
import * as Yup from 'yup';
import { Button, Stack } from "@mui/material";
import Form from "./form";
import { ErrorMessage, Field } from "formik";
import theme from "./theme";
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from "notistack";
import { useRefreshTeamState } from "../hooks/user-hooks";

export interface MyProps {
  previousTries: number[];
  previousCorrectness: Boolean | null;
  onSubmit: (result: any) => void;
  attempt: number;
}

export const ExcerciseForm: React.FunctionComponent<MyProps> = (props: MyProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const refreshState = useRefreshTeamState();
  useEffect(()=>{
    if(props.previousCorrectness!=null){
      if(props.previousCorrectness){
        console.log('A válasz helyes volt')
        enqueueSnackbar('A válasz helyes volt', { variant: 'success' });
      } else {
        console.log('A válasz sajnos nem volt jó')
        enqueueSnackbar('A válasz sajnos nem volt jó', { variant: 'error' });
      }
    }
  }, [props.previousCorrectness, props.attempt])
  return <Stack>
    <Stack sx={{
      fontSize: '22px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      marginBottom: '5px',
    }}>
      Eredmény megadása:
    </Stack>
    <Stack>
      <Form
        style={{ position: "relative", zIndex: 2 }}
        initialValues={{ result: '' }}
        validationSchema={Yup.object().shape({
          result: Yup.number()
            .integer('Egész számot kell írni')
            .typeError('Számot kell írnod')
            .min(1, 'A válasz 1 és 9999 között van')
            .max(9999, 'A válasz 1 és 9999 között van')
            .required('Nem írtál semmi választ!')
        })}
        onSubmit={(values) => {
          if (props.previousTries.includes(parseInt(values.result))) {
            enqueueSnackbar('Ezt a választ már próbáltátok', { variant: 'error' });
            return;
          }
          try{
            props.onSubmit(values.result)
            refreshState()
          } catch (e: any) {
            console.log(e)
            enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
            if (e?.message === "cannot make move after game end") {
              refreshState()
            }
          }
          
        }}>
        <Field
          name="result"
          type="text"
          style={{
            width: '100%',
            height: '40px',
            borderWidth: '2px',
            borderRadius: '5px',
            borderColor: theme.palette.primary.main,
            fontSize: '18px',
          }}
        />
        <ErrorMessage name="result" />
        <Stack sx={{marginTop: '20px'}}>
          {props.previousTries.map((data, idx) => {
            return <Stack sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              fontSize: 16,
            }}>
              {idx + 1}. próba
              <Stack sx={{
                fontSize: '18px',
                marginLeft: '10px',
              }}>{data}</Stack>
              <CloseIcon sx={{ color: '#FF0000', fontSize: '18ox' }} />
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
          Válasz
        </Button>
      </Form>
    </Stack>
  </Stack>
}