import React, { useState } from "react";
import { Stack } from "@mui/system";
import { ButtonBase, Typography } from "@mui/material";
import { useTranslation, Trans } from "react-i18next";

export interface ExerciseTaskProps {
  task: string;
  serial: number;
  availablePoints: number;
  pictureUrl: string | null;
}

// Fitted stretches small figures to the panel's width, at the cost of some
// blur. Zoomed doubles that and scrolls sideways, staying on the page so the
// answer form remains usable.
const fittedImage: React.CSSProperties = { display: 'block', width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', cursor: 'zoom-in' };
const zoomedImage: React.CSSProperties = { display: 'block', width: '100%', height: 'auto', cursor: 'zoom-out' };

export const ExerciseTask: React.FunctionComponent<ExerciseTaskProps> = (props: ExerciseTaskProps) => {
  const completestring = `<latex-js hyphenate="false">${props.task}
</latex-js>`;
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  // A new task starts fitted.
  const [shownUrl, setShownUrl] = useState(props.pictureUrl);
  if (shownUrl !== props.pictureUrl) {
    setShownUrl(props.pictureUrl);
    setZoomed(false);
  }
  return <Stack>
    <Trans sx={{ fontSize: '20px' }}
      i18nKey='relay.task'
      values={{ num: props.serial, availablePoints: t('general.points', { count: props.availablePoints }) }}
      />
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <>
      <div style={{ overflowX: 'auto', marginTop: '30px' }}>
        <ButtonBase onClick={() => setZoomed(z => !z)} aria-pressed={zoomed} disableRipple
          sx={{ display: 'block', width: zoomed ? '200%' : '100%', '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
          <img src={props.pictureUrl} style={zoomed ? zoomedImage : fittedImage} alt={t('relay.taskImage')}/>
        </ButtonBase>
      </div>
      <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>{t('relay.zoomImage')}</Typography>
    </>}
  </Stack>

}
