import { Button } from "@mui/material";
import { Stack, alpha } from "@mui/system";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../api-repository-interface";
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';

export function Disclaimer(props: {teamName: string, category: string}) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";
  const { t } = useTranslation(['disclaimer']);

  return (
    <Stack
      sx={{
        display: "flex",
        height: {
          xs: "100%",
          md: "auto",
        },
        width: {
          xs: "100%",
          md: "calc(100% - 80px)",
        },
        padding: {
          xs: "10px",
          md: "40px"
        },
        margin: {
          xs: 0,
          md: "40px"
        },
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
        borderRadius: {
          xs: 0,
          md: "30px",
        }
      }}
      data-testId={"disclaimerRoot"}
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
          <div style={{textAlign: "center"}}>
            <Trans
              i18nKey='welcome'
              ns='disclaimer'
              values={{ tname: props.teamName }}
              components={{
                bold: <i style={{color: theme.palette.primary.main}} />
              }} />
          </div>
        </Stack>
        <Stack sx={{
          fontStyle:"italic",
          alignSelf: "center",
          flexDirection: "row",
          fontSize: 18,
          marginBottom: "20px",
        }}>
          <div style={{textAlign: "center"}}>
            <Trans
              i18nKey='category'
              ns='disclaimer'
              values={{ category: props.category }}
              components={{
                bold: <strong style={{color: theme.palette.primary.main}} />
              }} />
          </div>
        </Stack>
        {t('start')}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {t('progress')}
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
        {t('progressDescription', {minpoints: 25, maxpoints: 52})}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {t('interface')}
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
          i18nKey={isOffline ? 'interfaceDescriptionBHTML' : 'interfaceDescription'}
          ns='disclaimer'
          components={{
            bold: <strong />,
            small: <small />,
            br: <br />
          }} />
        </div>
      </Stack>



      <Button
        sx={{
          width: {
            xs: "100%",
            sm: "350px",
          },
          height: "60px",
          fontSize: "26px",
          alignSelf: "center",
          textTransform: "none",
        }}
        variant="contained"
        color="primary"
        onClick={() => {
          goHome();
        }}
      >
        {t('continue')}
      </Button>
    </Stack>
  );
}
