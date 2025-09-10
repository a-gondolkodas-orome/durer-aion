import { Stack } from "@mui/system";
import { FinishedMatchStatus, TeamModelDto } from "../dto/TeamStateDto";
import { ChooserItem } from "./ChooserItem";
import { dictionary } from "../text-constants";
import { useClientRepo } from "../api-repository-interface";

export function Chooser(props: {
  state: TeamModelDto;
  setState: React.Dispatch<"R" | "S" | null>;
}) {
  const finalPoints =
    ((props.state.relayMatch as FinishedMatchStatus).score ?? 0) +
    ((props.state.strategyMatch as FinishedMatchStatus).score ?? 0);
  const finished =
    props.state.relayMatch.state === "FINISHED" &&
    props.state.strategyMatch.state === "FINISHED";
  const isOffline = useClientRepo().version === "OFFLINE";
  return (
    <Stack
      sx={{
        display: "flex",
        width: "100%",
        margin: { 
          xs: 0,
          md: "40px",
        },
        flexDirection: "column",
      }}
      data-testId={"chooserRoot"}
    >
      {finished && (
        <Stack
          sx={{
            display: "flex",
            width: {
              xs: "100%",
              md: "calc(100% - 81px)",
            },
            padding: {
              xs: "10px",
              md: "40px",
            },
            backgroundColor: "#fff",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontSize: "24px",
            }}
          >
            {dictionary.chooser.finish.title}
          </p>
          <span dangerouslySetInnerHTML={{ __html: dictionary.chooser.finish.content }}></span>
          <p
            style={{
              fontSize: "24px",
            }}
          >
            {dictionary.chooser.finish.final}: <b>{finalPoints}</b>
          </p>
          { isOffline && "A pontszámotok csak tájékoztató jellegű, a végleges pontszámotokat a beküldött válaszok alapján újraértékeljük."}
        </Stack>
      )}
      <Stack
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: {
            xs: "column",
            md: "row",
          }
        }}
      >
        <ChooserItem
          status={props.state.relayMatch}
          type="relay"
          setState={props.setState}
          hideDesc={finished}
        />
        <Stack sx={{ 
          width: "20px",
          height: "20px"
        }} />
        <ChooserItem
          status={props.state.strategyMatch}
          type="strategy"
          setState={props.setState}
          hideDesc={finished}
        />
      </Stack>
    </Stack>
  );
}
