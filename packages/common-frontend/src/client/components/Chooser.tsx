import { Stack } from "@mui/system";
import { FinishedMatchStatus, TeamModelDto } from "../dto/TeamStateDto";
import { ChooserItem } from "./ChooserItem";
import { cardSx } from "./card";
import { ScoreHeadline } from "./ResultTables";
import { useClientRepo } from "../client-repo-context";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useStartWindowNote } from "../hooks/start-window";

export function Chooser(props: {
  state: TeamModelDto;
}) {
  const relayScore = (props.state.relayMatch as FinishedMatchStatus).score ?? 0;
  const strategyScore = (props.state.strategyMatch as FinishedMatchStatus).score ?? 0;
  // The online round shows the matches the team's competition has; the local
  // apps serve no competition, and have both.
  const { competition } = props.state;
  const hasRelay = competition === undefined || competition?.relay !== undefined;
  const hasStrategy = competition === undefined || competition?.strategy !== undefined;
  const finished = (hasRelay || hasStrategy) &&
    (!hasRelay || props.state.relayMatch.state === "FINISHED") &&
    (!hasStrategy || props.state.strategyMatch.state === "FINISHED");
  const isOffline = useClientRepo().version === "OFFLINE";
  const { state: windowState, note: windowNote } = useStartWindowNote(props.state.startWindow);
  // Only while there is a round left to start: a team that is done sees its
  // results, and nothing about starting.
  const roundLeft = (hasRelay && props.state.relayMatch.state === "NOT STARTED")
    || (hasStrategy && props.state.strategyMatch.state === "NOT STARTED");
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      sx={{
        display: "flex",
        width: "100%",
        padding: {
          xs: "16px 12px",
          md: "40px 24px",
        },
        gap: "24px",
        flexDirection: "column",
      }}
      data-testid={"chooserRoot"}
    >
      {finished && (
        <Stack
          sx={{
            ...cardSx(theme),
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontSize: "24px",
            }}
          >
            {t('chooser.finish.title')}
          </p>
          <span style={{ textAlign: "center" }}>{t('chooser.finish.content')}</span>
          {/* Larger than either round's score below, which it adds up. */}
          <Stack sx={{ alignItems: "center", gap: "4px", marginY: "16px" }}>
            <span style={{ fontSize: "20px" }}>{t('chooser.finish.final')}</span>
            <ScoreHeadline points={relayScore + strategyScore}/>
            {hasRelay && hasStrategy && <span style={{ fontSize: "18px" }}>
              {t('chooser.finish.breakdown', { relay: relayScore, strategy: strategyScore })}
            </span>}
          </Stack>
          { isOffline && <span style={{ textAlign: "center" }}>{t('chooser.pointsNotSettled')}</span>}
        </Stack>
      )}
      {roundLeft && windowNote !== undefined && (
        <Stack sx={{ ...cardSx(theme), textAlign: "center", fontSize: "18px" }} data-testid="startWindowNote">
          {windowNote}
        </Stack>
      )}
      <Stack
        sx={{
          display: "flex",
          width: "100%",
          gap: { xs: "16px", md: "24px" },
          flexDirection: {
            xs: "column",
            md: "row",
          }
        }}
      >
        {hasRelay && <ChooserItem
          status={props.state.relayMatch}
          type="relay"
          competition={competition}
          canStart={windowState === "open"}
        />}
        {hasStrategy && <ChooserItem
          status={props.state.strategyMatch}
          type="strategy"
          competition={competition}
          canStart={windowState === "open"}
        />}
      </Stack>
    </Stack>
  );
}

