import React from "react";
import { Stack } from "@mui/system";
import { useTranslation, Trans } from "react-i18next";

export interface ExerciseTaskProps {
  task: string;
  serial: number;
  maxPoints: number;
  pictureUrl: string | null;
}

// latex.js sets Computer Modern on KaTeX 0.12's `.mathdefault`, but the KaTeX it bundles emits
// `.mathnormal`, and Chromium ignores the KaTeX_Math @font-face declared in the shadow root, so
// without this math letters take the OS's serif italic. latex.js links `stylesheet` into its shadow root.
const mathFontCss = '.katex .mathnormal { font-family: "Computer Modern Serif" !important; font-style: italic; }';
const mathFontStylesheet = `data:text/css,${encodeURIComponent(mathFontCss)}`;

export const ExerciseTask: React.FunctionComponent<ExerciseTaskProps> = (props: ExerciseTaskProps) => {
  const completestring = `<latex-js hyphenate="false" stylesheet="${mathFontStylesheet}">${props.task}
</latex-js>`;
  const { t } = useTranslation();
  return <Stack>
    <Trans sx={{ fontSize: '20px' }}
      i18nKey='relay.task'
      values={{ num: props.serial, maxpoints: t('general.points', { count: props.maxPoints }) }}
      />
    <div dangerouslySetInnerHTML={{ __html: completestring }} />
    {props.pictureUrl && <img src={props.pictureUrl} style={{ maxWidth: '80%', display: 'flex', marginLeft: 'auto', marginRight: 'auto', marginTop: "30px" }} alt={t('relay.taskImage')}/>}
  </Stack>

}
