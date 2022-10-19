import React, { useEffect, useState } from "react";
import * as Yup from 'yup';
import { useSnackbar } from "notistack";
import moment from "moment";
import { Stack } from "@mui/system";

export interface MyProps {
  task: string;
  serial: number;
  maxPoints: number;
  pictureUrl: string | null;
}

export const ExcerciseTask: React.FunctionComponent<MyProps> = (props: MyProps) => {
  const completestring = `<latex-js hyphenate="false">${props.task}
</latex-js>`;
  return <Stack>
    <Stack sx={{fontSize: '20px'}}>
      {props.serial}. Feladat ({props.serial} pont):
    </Stack>
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <img src={props.pictureUrl} style={{maxWidth:'80%', display: 'flex', marginLeft:'auto', marginRight: 'auto', marginTop: "30px"}} alt={'feladatKép (ha nem töltött be próbáld frissíteni az oldalt)'}/>}
  </Stack>
    
}