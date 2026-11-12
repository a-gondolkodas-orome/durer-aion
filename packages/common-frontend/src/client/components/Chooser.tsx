import { Stack } from "@mui/system";
import type { TFunction } from "i18next";
import type { Language, StartWindow, StartWindowState } from "schemas";
import { FinishedMatchStatus, TeamModelDto } from "../dto/TeamStateDto";
import { ChooserItem } from "./ChooserItem";
import { cardSx } from "./card";
import { ScoreHeadline } from "./ResultTables";
import { useClientRepo } from "../client-repo-context";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useStartWindowState } from "../hooks/start-window";
import { useUiLanguage } from "../hooks/ui-language";

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
  const windowState = useStartWindowState(props.state.startWindow);
  const language = useUiLanguage();
  // Only while there is a round left to start: a team that is done sees its
  // results, and nothing about starting.
  const roundLeft = (hasRelay && props.state.relayMatch.state === "NOT STARTED")
    || (hasStrategy && props.state.strategyMatch.state === "NOT STARTED");
  const theme = useTheme();
  const { t } = useTranslation();
  const windowNote = windowNoteFor(windowState, props.state.startWindow, language, t);

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

/// A time of the start window as the team reads it: its date and its time, in
/// the browser's time zone.
function windowTime(time: string, language: Language): string {
  return new Intl.DateTimeFormat(language, {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(time));
}

/// What the home screen says about when the rounds may start, if anything.
function windowNoteFor(
  state: StartWindowState, startWindow: StartWindow | null | undefined, language: Language, t: TFunction,
): string | undefined {
  if (startWindow === null || startWindow === undefined) return undefined;
  if (state === "not-open-yet") return t("chooser.window.notOpenYet", { time: windowTime(startWindow.opensAt, language) });
  if (state === "closed") return t("chooser.window.closed");
  return startWindow.closesAt === undefined
    ? undefined
    : t("chooser.window.openUntil", { time: windowTime(startWindow.closesAt, language) });
}
