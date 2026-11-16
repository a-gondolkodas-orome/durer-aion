import { Button } from "@mui/material";
import { Stack } from "@mui/system";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { cardButtonSx, cardSx } from "./card";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../client-repo-context";
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';
import type { Language, PublicCompetition, StartWindow } from 'schemas';
import { useStartWindowNote } from '../hooks/start-window';
import { useUiLanguage } from '../hooks/ui-language';
import { competingEnd, maxPoints } from './round-numbers';

/// A time of day as the team reads it, in the browser's time zone. English is
/// British, as elsewhere.
function timeOfDay(time: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { hour: "2-digit", minute: "2-digit" })
    .format(time);
}

export function Disclaimer(props: {
  teamName: string, category: string, competition?: PublicCompetition | null,
  startWindow?: StartWindow | null, clockOffsetMs?: number,
}) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";
  const { t } = useTranslation();
  // Reading on is allowed at any time, the rules included; only the start
  // waits for the window, and this says so before the team clicks through.
  const { note: windowNote } = useStartWindowNote(props.startWindow, props.clockOffsetMs);
  const language = useUiLanguage();

  // The online round has words of its own; any other competition is told of
  // in general ones. Without a competition there is nothing to play, and
  // nothing but the general words to say.
  const { competition } = props;
  const metadata = competition?.metadata;
  const online = metadata?.kind === 'competition' && metadata.round === 'online';
  const end = competition ? competingEnd(props.startWindow, competition) : undefined;
  const until = end === undefined ? '' : t('disclaimer.until', { time: timeOfDay(end, language) });
  const advancingPoints = competition?.advancingPoints;

  return (
    <Stack
      sx={{
        ...cardSx(theme),
        flexDirection: "column",
        margin: {
          xs: "16px 12px",
          md: "40px 24px",
        },
      }}
      data-testid={"disclaimerRoot"}
    >
      <Stack
        sx={{
          fontSize: 16,
          marginBottom: "25px",
        }}
      >
        <Stack sx={{
          fontSize: 24,
          marginBottom: "2px",
          flexDirection: "row",
          alignSelf: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <Trans
              // t('disclaimer.welcomeOnline')
              // t('disclaimer.welcome')
              i18nKey={online ? 'disclaimer.welcomeOnline' : 'disclaimer.welcome'}
              values={{ tname: props.teamName }}
              components={{
                i: <i style={{ color: theme.palette.primary.main }} />
              }} />
          </div>
        </Stack>
        <Stack sx={{
          fontStyle: "italic",
          alignSelf: "center",
          flexDirection: "row",
          fontSize: 18,
          marginBottom: "20px",
        }}>
          <div style={{ textAlign: "center" }}>
            <Trans
              i18nKey='disclaimer.category'
              values={{ category: props.category }}
              components={{
                b: <b style={{ color: theme.palette.primary.main }} />
              }} />
          </div>
        </Stack>
        {online ? t('disclaimer.startOnline', { until }) : t('disclaimer.start', { until })}
      </Stack>

      {competition && advancingPoints !== undefined && <>
        <Stack
          sx={{
            fontSize: 24,
            marginBottom: "10px",
            fontStyle: "italic",
          }}
        >
          {t('disclaimer.progress')}
        </Stack>

        <Stack
          sx={{
            fontSize: 16,
            marginBottom: {
              xs: "15px",
              md: "15px",
            }
          }}
        >
          {online
            ? t('disclaimer.progressDescriptionOnline', { minpoints: advancingPoints, maxpoints: maxPoints(competition) })
            : t('disclaimer.progressDescription', { minpoints: advancingPoints, maxpoints: maxPoints(competition) })}
        </Stack>
      </>}

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {t('disclaimer.interface')}
      </Stack>

      <Stack
        sx={{
          fontSize: 16,
          marginBottom: {
            xs: "15px",
            md: "75px",
          }
        }}
      >
        <div>
          <Trans
            // t('disclaimer.interfaceDescriptionOfflineMode')
            // t('disclaimer.interfaceDescription')
            i18nKey={isOffline ? 'disclaimer.interfaceDescriptionOfflineMode' : 'disclaimer.interfaceDescription'}
            components={{
              b: <b />,
              small: <small />,
              br: <br />
            }}
          />
        </div>
      </Stack>


      {windowNote !== undefined && (
        <Stack sx={{ textAlign: "center", fontSize: "18px", fontWeight: 500, marginBottom: "20px" }}
          data-testid="startWindowNote">
          {windowNote}
        </Stack>
      )}
      <Button
        sx={{
          width: {
            xs: "100%",
            sm: "350px",
          },
          ...cardButtonSx(theme),
          alignSelf: "center",
        }}
        variant="contained"
        color="primary"
        disableElevation
        endIcon={<ArrowForwardRounded />}
        onClick={() => {
          void goHome();
        }}
      >
        {t('disclaimer.continue')}
      </Button>
    </Stack>
  );
}
