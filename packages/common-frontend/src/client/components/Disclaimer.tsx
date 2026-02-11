import { Button } from "@mui/material";
import { Stack } from "@mui/system";
import { dictionary } from "../text-constants";
import { useToHome } from "../hooks/user-hooks";
import { useClientRepo } from "../api-repository-interface";
import { useTheme } from "@mui/material/styles";

export function TextComponentWithPlaceholders(props: {fulltext: string, placeholders: object, genStyle?: object, extraStyleForVars?: object}): JSX.Element {
  // shallow merge the extra styles with default
  const varStyle = Object.assign({color: useTheme().palette.primary.main, fontStyle: "italic", fontWeight: "normal"}, props.extraStyleForVars || {});
  // A RegEx is used to split the text into variables and substrings around them
  const placeholderregexp = new RegExp(`(.*?)(${Object.keys(props.placeholders).join('|')})(.*?)(?={|$)`, 'g'); 

  return (
  <div style={{...{textAlign: "center"}, ...props.genStyle}}>
    {/* Collect groups from matches and assign a span element to each group */
    [...props.fulltext.matchAll(placeholderregexp)].map((matchlist) => matchlist.slice(1)).flat().map((content, i) => 
    <span style={content.includes('{') ? varStyle : {}} key={i}>
      {content.includes('{') ? props.placeholders[content as keyof typeof props.placeholders] : content}
    </span>)}
  </div>
)}

export function Disclaimer(props: {teamName: string, category: string}) {
  const goHome = useToHome();
  const theme = useTheme();
  const isOffline = useClientRepo().version === "OFFLINE";
  const placeholders = {'{teamName}': props.teamName, '{category}': props.category, '{maxPoints}': 52, '{minPoints}': 25};

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
        <TextComponentWithPlaceholders placeholders={placeholders} fulltext={dictionary.disclaimer.welcome} genStyle={{
          fontSize: 24,
          marginBottom: "4px",
        }}/>
        <TextComponentWithPlaceholders placeholders={placeholders} fulltext={dictionary.disclaimer.category} extraStyleForVars={{fontWeight: "bold"}} genStyle={{
          fontSize: 18,
          fontStyle:"italic",
          marginBottom: "20px",
        }}/>
        <TextComponentWithPlaceholders placeholders={{'{deadline}': dictionary.disclaimer.startDeadline, '{ownWork}': dictionary.disclaimer.startOwnWork}}
          fulltext={dictionary.disclaimer.start}
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
