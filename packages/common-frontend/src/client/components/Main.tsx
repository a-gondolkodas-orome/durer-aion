import { Container } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header, PAGE_MAX_WIDTH, STRATEGY_PAGE_MAX_WIDTH } from "./Header";
import { Layout } from "./Layout";
import { Login } from "./Login";
import { FROM_COMPETITION_PARAM } from "./admin-params";
import { LoginLayout } from "./LoginLayout";
import { Relay } from "./teamstates/Relay";
import { Strategy } from "./teamstates/Strategy";
import { Disclaimer } from "./Disclaimer";
import { Chooser } from "./Chooser";
import { Loading } from "./Loading";
import { ErrorBoundary } from "./ErrorBoundary";
import { SiteFooter } from "./SiteFooter";
import { EndRoundProvider } from "./end-round";
import i18next from "i18next";
import { useClientRepo, useOptionalAdminRepo } from "../client-repo-context";
import { useTranslation } from "react-i18next";
import { competitionHeading } from "./competition-heading";
import { roundsView } from "./rounds-view";
import { competitionLanguage, loginLanguage, readChosenLanguage, rememberChosenLanguage } from "../hooks/ui-language";

// A chunk of its own, the data grid and the syntax highlighter with it: those
// are over half of the page's JavaScript, and a team never needs them, on a
// school network least of all (#715). Admin.tsx and TeamDetailDialog.tsx are
// therefore not exported from the package, which would pull them back into
// the entry chunk.
const Admin = React.lazy(() => import("./Admin").then(module => ({ default: module.Admin })));

/// What an admin path opens: `/admin/verseny/new` the page making a new
/// competition, which no id can clash with since an id holds `--`,
/// `/admin/verseny/<id>` a competition's page, `/admin/verseny/<id>/edit` its
/// edit page, `/admin/feladat/<problemId>` a
/// problem's editor, with `?verseny=<id>` the competition it was opened from,
/// `/admin/<teamId>` a team's, anything else the tabs.
export function adminPath(pathname: string, search = ''):
  { teamId?: string, competitionId?: string, edit?: true, problemId?: string, newCompetition?: true } {
  const [, , first, second, third] = pathname.split('/');
  if (first === 'feladat') {
    if (!second) return {};
    const from = new URLSearchParams(search).get(FROM_COMPETITION_PARAM);
    return { problemId: decodeURIComponent(second), ...(from && { competitionId: from }) };
  }
  if (first === 'verseny') {
    if (!second) return {};
    if (second === 'new' && third === undefined) return { newCompetition: true };
    return { competitionId: decodeURIComponent(second), ...(third === 'edit' && { edit: true }) };
  }
  return first ? { teamId: first } : {};
}

export function Main(props: { gitCommitHash: string }) {
  const teamState = useTeamState();
  // Only the online app provides an admin repository; elsewhere `/admin` is
  // just a path, and the team's own pages answer it.
  const admin = useOptionalAdminRepo() !== null && window.location.pathname.includes('/admin');

  const maxWidth = !admin && teamState?.pageState === "STRATEGY" ? STRATEGY_PAGE_MAX_WIDTH : PAGE_MAX_WIDTH;

  // The team's competition decides the language; with two, the team chooses.
  // The login page has no competition to go by yet, so it follows the choice
  // alone. The admin pages are written in Hungarian only.
  const [chosenLanguage, setChosenLanguage] = useState(readChosenLanguage);
  const languages = admin ? undefined : teamState?.competition?.languages;
  const language = admin ? 'hu'
    : languages === undefined ? loginLanguage(chosenLanguage)
      : competitionLanguage(languages, chosenLanguage);
  const chooseLanguage = (chosen: string) => {
    setChosenLanguage(chosen);
    rememberChosenLanguage(chosen);
  };

  useEffect(() => {
    void i18next.changeLanguage(language);
  }, [language])

  const { t } = useTranslation();
  const heading = competitionHeading(admin ? undefined : teamState?.competition, language, t);
  // The dry run's tab keeps its own title, which says it is a rehearsal.
  const online = useClientRepo().version === "ONLINE";
  useEffect(() => {
    if (online) document.title = heading.title;
  }, [online, heading.title]);

  return (
    <Layout>
      <EndRoundProvider>
      {/* The admin pages are no team's: asking `team/me` there only costs a
          request, and its error if the basic-auth prompt outlasts the timeout */}
      {!admin && <LoadTeamState />}
      <Header teamName={admin ? null : teamState?.teamName ?? null} heading={heading}
        compact={!admin && (teamState?.pageState === "RELAY" || teamState?.pageState === "STRATEGY")} maxWidth={maxWidth}
        languageSwitcher={languages !== undefined && languages.length > 1} onChooseLanguage={chooseLanguage}
        rounds={admin ? undefined : roundsView(teamState)}/>
      {/* `maxWidth={false}`: MUI's default `maxWidth="lg"` sets the theme's lg
          breakpoint, 1280px, at that width and up, overriding the sx below */}
      <Container
        maxWidth={false}
        sx={{
          paddingLeft: {
            xs: "0px",
            sm: "0px",
            md: "0px",
          },
          paddingRight: {
            xs: "0px",
            sm: "0px",
            md: "0px",
          },
          position: "relative",
          paddingBottom: "50px",
          maxWidth: `${maxWidth}px`,
        }}
        data-testid="mainRoot"
      >
        <ErrorBoundary resetKeys={[teamState?.teamName, teamState?.pageState]}>
          {/* One branch, not independent conditions: `/admin` is the whole page,
              never a panel above whatever the browser's own session is entitled
              to — the join-code login form for an organiser with no team cookie,
              or a live, playable board for one still holding a team's session
              from testing. */}
          {admin ? <React.Suspense fallback={<Loading/>}>
            <Admin {...adminPath(window.location.pathname, window.location.search)}/>
          </React.Suspense> : <>
            {/* `undefined`, not yet known, renders nothing: see the store */}
            {teamState === null && <LoginLayout><Login /></LoginLayout>}
            {teamState && teamState.pageState === "DISCLAIMER" && (
              <Disclaimer teamName={teamState.teamName} competition={teamState.competition}
                startWindow={teamState.startWindow} clockOffsetMs={teamState.clockOffsetMs}/>
            )}
            {teamState && teamState.pageState === "HOME" && (
              <Chooser state={teamState}/>
            )}
            {teamState && teamState.pageState === "RELAY" && (
              <Relay state={teamState} />
            )}
            {teamState && teamState.pageState === "STRATEGY" && (
              <Strategy state={teamState} />
            )}
          </>}
        </ErrorBoundary>
      </Container>
      {/* The note only on the login page: an admin page loads no tracker, and
          a team mid-round has the clock to read, not this */}
      <SiteFooter gitCommitHash={props.gitCommitHash} trackingNote={!admin && teamState === null}/>
      </EndRoundProvider>
    </Layout>
  );
}
