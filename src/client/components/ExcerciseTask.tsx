import React from "react";
import { Stack } from "@mui/system";
import { dictionary } from "../text-constants";

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
      {props.serial}. {dictionary.general.task} ({props.maxPoints} {dictionary.general.point}):
    </Stack>
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <img src={props.pictureUrl} style={{maxWidth:'80%', display: 'flex', marginLeft:'auto', marginRight: 'auto', marginTop: "30px"}} alt={'feladatKép (ha nem töltött be próbáld frissíteni az oldalt)'}/>}
  </Stack>
    
}