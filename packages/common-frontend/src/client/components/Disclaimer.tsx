import { Button } from "@mui/material";
import { Stack, alpha } from "@mui/system";
import { dictionary } from "../text-constants";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../api-repository-interface";
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';

export function Disclaimer(props: {teamName: string, category: string}) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";
  const { t } = useTranslation();

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
            <Trans i18nKey={'disclaimer:welcome'} values={{ tname: props.teamName }}>
              Kedves <i style={{color: theme.palette.primary.main}}>{props.teamName}</i> csapat, üdvözlünk az online fordulón!
            </Trans>
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
            <Trans i18nKey={'disclaimer:category'} values={{ category: props.category }}>
              Kategóriátok: <strong style={{color: theme.palette.primary.main}}>{props.category}</strong>
            </Trans>
          </div>
        </Stack>
        {t('disclaimer:start')}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {t('disclaimer:progress')}
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
        {t('disclaimer:progressDescription', {minpoints: 25, maxpoints: 52})}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {t('disclaimer:interface')}
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
        <span dangerouslySetInnerHTML={{ __html: ( isOffline ? dictionary.disclaimer.interfaceDescriptionBHTML : dictionary.disclaimer.interfaceDescription) }}></span>
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
        {dictionary.disclaimer.continue}
      </Button>
    </Stack>
  );
}
