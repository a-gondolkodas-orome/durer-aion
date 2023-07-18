import React from "react";
import { Stack } from "@mui/system";
import { MathJax, MathJaxContext } from "better-react-mathjax";

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
      {props.serial}. Feladat ({props.maxPoints} pont):
    </Stack>
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <img src={props.pictureUrl} style={{maxWidth:'80%', display: 'flex', marginLeft:'auto', marginRight: 'auto', marginTop: "30px"}} alt={'feladatKép (ha nem töltött be próbáld frissíteni az oldalt)'}/>}
  </Stack>
    
}

export const ExcerciseTaskMathJax: React.FunctionComponent<MyProps> = (props: MyProps) => {
  return <Stack>
    <Stack sx={{fontSize: '20px'}}>
      {props.serial}. Feladat ({props.maxPoints} pont):
    </Stack>
    <MathJaxContext>
      <MathJax dynamic={true}>
        <div dangerouslySetInnerHTML={{ __html: props.task }} />
        {props.pictureUrl && <img src={props.pictureUrl} style={{maxWidth:'80%', display: 'flex', marginLeft:'auto', marginRight: 'auto', marginTop: "30px"}} alt={'feladatKép (ha nem töltött be a kép, akkor jelentsd be a hibát.)'}/>}
      </MathJax>
    </MathJaxContext>
  </Stack>    
}