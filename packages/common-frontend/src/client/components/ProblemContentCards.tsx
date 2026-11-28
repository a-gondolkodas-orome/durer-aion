import { Box, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { Language, Problem } from 'schemas';
import { LANGUAGES, localizeProblem } from 'schemas';
import { BORDER, MUTED } from './adminStyles';
import { Card } from './EditPageParts';
import { ExerciseTask } from './ExerciseTask';
import { type ContentForm, FIELD_NAMES, LANGUAGE_NAMES, hasContent } from './problem-form';

// A problem's text and image in each language, its LaTeX beside what a team
// sees: the problem editor's, and the relay editor's for a problem it creates.

export function ProblemContentCards(props: {
  content: Record<Language, ContentForm>, onChange: (language: Language, change: Partial<ContentForm>) => void,
  disabled?: boolean, serial: number, points: number, broken: (url: string) => boolean,
  onPictureLoad: (url: string, loaded: boolean) => void,
}) {
  const { content } = props;
  // A language without content shows another one's, as for a team.
  const draft: Problem = {
    id: '', answer: 0,
    content: Object.fromEntries(LANGUAGES.filter(each => hasContent(content[each]))
      .map(each => [each, { ...content[each], imageUrl: content[each].imageUrl.trim() || undefined }])),
  };
  return <>
    {LANGUAGES.map((language) => {
      const { problemText, imageUrl } = content[language];
      const broken = props.broken(imageUrl.trim());
      const name = LANGUAGE_NAMES[language];
      return (
        <Card key={language} title={name[0].toUpperCase() + name.slice(1)}>
          <Box sx={{ display: 'grid', gap: '24px', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <Stack sx={{ gap: '16px' }}>
              <TextField multiline minRows={6} label={`${FIELD_NAMES.problemText}, ${name}`} value={problemText}
                disabled={props.disabled} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
                helperText={hasContent(content[language]) ? ' ' : 'Üresen ezen a nyelven a másik nyelv szövege látszik.'}
                onChange={(event) => { props.onChange(language, { problemText: event.target.value }); }}/>
              <TextField label={`${FIELD_NAMES.imageUrl}, ${name} (nem kötelező)`} value={imageUrl} disabled={props.disabled}
                placeholder="https://durerinfo.hu/…" slotProps={{ inputLabel: { shrink: true } }}
                error={broken} helperText={broken ? 'A kép nem töltődik be a böngészőben.' : ' '}
                onChange={(event) => { props.onChange(language, { imageUrl: event.target.value }); }}/>
            </Stack>
            <Stack aria-label={`Így látja a csapat, ${name}`} role="region" sx={{ border: `1px solid ${BORDER}`,
              borderRadius: '10px', padding: '22px', gap: '12px', minWidth: 0 }}>
              <Typography sx={{ fontSize: '13px', color: MUTED }}>Így látja a csapat</Typography>
              {Object.keys(draft.content).length === 0 ? <Typography sx={{ fontSize: '14px' }}>Nincs szövege.</Typography>
                : <Preview problem={draft} language={language} serial={props.serial} points={props.points}
                  onPictureLoad={props.onPictureLoad}/>}
            </Stack>
          </Box>
        </Card>
      );
    })}
  </>;
}

function Preview(props: {
  problem: Problem, language: Language, serial: number, points: number, onPictureLoad: (url: string, loaded: boolean) => void,
}) {
  const { problemText, imageUrl } = localizeProblem(props.problem, props.language);
  return (
    <ExerciseTask task={problemText} serial={props.serial} availablePoints={props.points} pictureUrl={imageUrl ?? null}
      language={props.language}
      onPictureLoad={(loaded) => { if (imageUrl !== undefined) props.onPictureLoad(imageUrl, loaded); }}/>
  );
}

/** The warnings for images that failed to load in the preview, one per language. */
export function brokenImageWarnings(content: Record<Language, ContentForm>, broken: (url: string) => boolean,
  where = ''): string[] {
  return LANGUAGES.flatMap((language) => {
    const url = content[language].imageUrl.trim();
    return broken(url) ? [`${where}A kép nem töltődik be a böngészőben (${LANGUAGE_NAMES[language]}): ${url}`] : [];
  });
}
