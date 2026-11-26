import React, { useState } from "react";
import { Stack } from "@mui/system";
import { ButtonBase, Dialog, IconButton, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation, Trans } from "react-i18next";

export interface ExerciseTaskProps {
  task: string;
  serial: number;
  availablePoints: number;
  pictureUrl: string | null;
  /** The language of the words around the task, where it is not the page's:
   *  the admin page, in Hungarian, shows a task as a team of another language
   *  sees it. */
  language?: string;
}

// Both sizes stretch small figures, at the cost of some blur: in the panel to
// its width, enlarged to the whole window.
const fittedImage: React.CSSProperties = { display: 'block', width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', cursor: 'zoom-in' };
const enlargedImage: React.CSSProperties = { display: 'block', width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-out' };

export const ExerciseTask: React.FunctionComponent<ExerciseTaskProps> = (props: ExerciseTaskProps) => {
  const completestring = `<latex-js hyphenate="false">${props.task}
</latex-js>`;
  const { t } = useTranslation(undefined, props.language === undefined ? undefined : { lng: props.language });
  const [enlarged, setEnlarged] = useState(false);
  const close = () => setEnlarged(false);
  return <Stack>
    <Trans t={t} sx={{ fontSize: '20px' }}
      i18nKey='relay.task'
      values={{ num: props.serial, availablePoints: t('general.points', { count: props.availablePoints }) }}
      />
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <>
      <ButtonBase onClick={() => setEnlarged(true)} disableRipple
        sx={{ display: 'block', width: '100%', marginTop: '30px', '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
        <img src={props.pictureUrl} style={fittedImage} alt={t('relay.taskImage')}/>
      </ButtonBase>
      <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>{t('relay.zoomImage')}</Typography>
      {/* A click anywhere, Esc, or the close button shrinks it back. It covers the
          snackbar layer (Layout's 1400), which would hide the close button: nothing
          can be submitted from here, and a persistent snackbar is still there after. */}
      <Dialog open={enlarged} onClose={close} fullScreen onClick={close} sx={{ zIndex: 1500 }}
        slotProps={{ paper: { sx: { backgroundColor: 'background.paper', padding: '2vmin' } } }}>
        <img src={props.pictureUrl} style={enlargedImage} alt={t('relay.taskImage')}/>
        <IconButton onClick={close} aria-label={t('general.close')}
          sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'background.paper' }}>
          <CloseIcon />
        </IconButton>
      </Dialog>
    </>}
  </Stack>

}
