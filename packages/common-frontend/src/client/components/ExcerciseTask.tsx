import React from "react";
import { Stack } from "@mui/system";
import { useTranslation, Trans } from "react-i18next";

export interface ExcerciseTaskProps {
  task: string;
  serial: number;
  maxPoints: number;
  pictureUrl: string | null;
}

export const ExcerciseTask: React.FunctionComponent<ExcerciseTaskProps> = (props: ExcerciseTaskProps) => {
  const completestring = `<latex-js hyphenate="false">${props.task}
</latex-js>`;
  const { t } = useTranslation();
  return <Stack>
    <Trans sx={{fontSize: '20px'}}
      i18nKey='relay.task'
      values={{ num: props.serial, maxpoints: t('general.points', { count: props.maxPoints})}}
      />
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <img src={props.pictureUrl} style={{maxWidth:'80%', display: 'flex', marginLeft:'auto', marginRight: 'auto', marginTop: "30px"}} alt={t('relay.taskImage')}/>}
  </Stack>
    
}