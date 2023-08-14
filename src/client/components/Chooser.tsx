import { Stack } from "@mui/system";
import { FinishedMatchStatus, TeamModelDto } from "../dto/TeamStateDto";
import { ChooserItem } from "./ChooserItem";
import { dictionary } from "../text-constants";

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
  return (
    <Stack
      sx={{
        display: "flex",
        width: "100%",
        margin: "40px",
        flexDirection: "column",
      }}
      data-testId={"chooserRoot"}
    >
      {finished && (
        <Stack
          sx={{
            display: "flex",
            width: "calc(100% - 81px)",
            padding: "40px",
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
          <p>{dictionary.chooser.finish.content}</p>
          <p
            style={{
              fontSize: "24px",
            }}
          >
            {dictionary.chooser.finish.final}: <b>{finalPoints}</b>
          </p>
        </Stack>
      )}
      <Stack
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
        }}
      >
        <ChooserItem
          status={props.state.relayMatch}
          type="relay"
          setState={props.setState}
          hideDesc={finished}
        />
        <Stack sx={{ width: "20px" }} />
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
