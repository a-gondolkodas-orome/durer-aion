import { Button } from "@mui/material";
import { fontWeight, Stack } from "@mui/system";
import { dictionary } from "../text-constants";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../api-repository-interface";
import { useTheme } from "@mui/material/styles";

export function Disclaimer(props: {teamName: string, category: string}) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";

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
        backgroundColor: theme.palette.background.paper,
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
          marginBottom: {
            xs: "10px",
            md: "25px"
          },
        }}
      >
        <Stack sx={{
          fontSize: 24,
          marginBottom: "2px",
          flexDirection: "row",
          alignSelf: "center",
        }}>
          <div style={{textAlign: "center"}}>
            {dictionary.disclaimer.welcome.split('{teamName}')[0]}
            <span style={{fontStyle: "italic", color: theme.palette.primary.main}}>{props.teamName}</span>
            {dictionary.disclaimer.welcome.split('{teamName}')[1]}
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
            {dictionary.disclaimer.category.split('{category}')[0]}
            <span style={{fontWeight: "bold", color: theme.palette.primary.main}}>{props.category}</span>
            {dictionary.disclaimer.category.split('{category}')[1]}
          </div>
        </Stack>
        {dictionary.disclaimer.start}
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: {
            xs: "0px",
            md: "10px"
          },
          fontStyle: "italic",
        }}
      >
        {dictionary.disclaimer.progress}
      </Stack>

      <Stack
        sx={{
          fontSize: 16,
          marginBottom: {
            xs: "10px",
            md: "25px"
          }
        }}
      >
        <TextComponentWithPlaceholders placeholders={placeholders}
          fulltext={dictionary.disclaimer.progressDescription} 
          genStyle={{textAlign: "inherit"}} extraStyleForVars={{fontStyle: "normal", fontWeight: "bold"}}
        />
      </Stack>

      <Stack
        sx={{
          fontSize: 24,
          marginBottom: {
            xs: "0px",
            md: "10px"
          },
          fontStyle: "italic",
        }}
      >
        {dictionary.disclaimer.interface}
      </Stack>

      <Stack
        sx={{
          fontSize: 16,
          marginBottom: {
            xs: "20px",
            md: "40px",
          }
        }}
      >
        <TextComponentWithPlaceholders placeholders={{'{maximumOneDevice}': dictionary.disclaimer.interfaceMaxDevice, '{dontRefresh}': dictionary.disclaimer.interfaceDontRefresh}}
          fulltext={isOffline ? dictionary.disclaimer.interfaceDescriptionBHTML : dictionary.disclaimer.interfaceDescription} 
          genStyle={{textAlign: "inherit"}} extraStyleForVars={{fontStyle: "normal", fontWeight: "bold"}}
        />
        {isOffline ? <small>{dictionary.disclaimer.interfaceDescripSmall}</small>: ''}
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
