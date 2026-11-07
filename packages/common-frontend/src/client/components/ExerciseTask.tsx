import React from "react";
import { Stack } from "@mui/system";
import { Typography } from "@mui/material";
import { useTranslation, Trans } from "react-i18next";

export interface ExerciseTaskProps {
  task: string;
  serial: number;
  availablePoints: number;
  pictureUrl: string | null;
}

export const ExerciseTask: React.FunctionComponent<ExerciseTaskProps> = (props: ExerciseTaskProps) => {
  const completestring = `<latex-js hyphenate="false">${props.task}
</latex-js>`;
  const { t } = useTranslation();
  return <Stack>
    <Trans sx={{ fontSize: '20px' }}
      i18nKey='relay.task'
      values={{ num: props.serial, availablePoints: t('general.points', { count: props.availablePoints }) }}
      />
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {/* A new tab leaves zooming to the browser, pinch-zoom on phones included; the round keeps running in this one. */}
    {props.pictureUrl && <a href={props.pictureUrl} target="_blank" rel="noopener noreferrer" title={t('relay.enlargeImage')}>
      <img src={props.pictureUrl} style={{ maxWidth: '80%', display: 'flex', marginLeft: 'auto', marginRight: 'auto', marginTop: "30px", cursor: 'zoom-in' }} alt={t('relay.taskImage')}/>
    </a>}
    {props.pictureUrl && <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>{t('relay.enlargeImage')}</Typography>}
  </Stack>

}
