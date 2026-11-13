import { Container } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header, PAGE_MAX_WIDTH, STRATEGY_PAGE_MAX_WIDTH } from "./Header";
import { Layout } from "./Layout";
import { Login } from "./Login";
import { LoginLayout } from "./LoginLayout";
import { Relay } from "./teamstates/Relay";
import { Strategy } from "./teamstates/Strategy";
import { Disclaimer } from "./Disclaimer";
import { Chooser } from "./Chooser";
import { Admin } from "./Admin";
import { ErrorBoundary } from "./ErrorBoundary";
import i18next from "i18next";
import { useOptionalAdminRepo } from "../client-repo-context";
import { competitionLanguage, loginLanguage, readChosenLanguage, rememberChosenLanguage } from "../hooks/ui-language";

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

  return (
    <Layout>
      <LoadTeamState />
      <Header teamName={teamState?.teamName ?? null}
        compact={teamState?.pageState === "RELAY" || teamState?.pageState === "STRATEGY"} maxWidth={maxWidth}
        languageSwitcher={languages !== undefined && languages.length > 1} onChooseLanguage={chooseLanguage}/>
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
          {admin ? <Admin teamId={window.location.pathname.split('/').at(2)}/> : <>
            {!teamState && <LoginLayout><Login /></LoginLayout>}
            {teamState && teamState.pageState === "DISCLAIMER" && (
              <Disclaimer teamName={teamState.teamName} category={teamState.category}
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
      <footer style={{
        textAlign: "center",
        color: "#777",
        fontSize: '70%',
        marginBottom: '8px'
      }}>
        <div>{props.gitCommitHash}</div>
      </footer>
    </Layout>
  );
}
