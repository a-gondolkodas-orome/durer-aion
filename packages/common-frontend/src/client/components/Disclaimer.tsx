import { Button } from "@mui/material";
import { Stack } from "@mui/system";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { cardButtonSx, cardSx } from "./card";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../client-repo-context";
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';

export function Disclaimer(props: { teamName: string, category: string }) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";
  const { t } = useTranslation();

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
              i18nKey='disclaimer.welcome'
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
        {t('disclaimer.start')}
      </Stack>

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
        {t('disclaimer.progressDescription', { minpoints: 25, maxpoints: 52 })}
      </Stack>

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


      <Button
        sx={{
          width: {
            xs: "100%",
            sm: "350px",
          },
          ...cardButtonSx,
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
