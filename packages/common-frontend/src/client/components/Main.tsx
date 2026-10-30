import { Container } from "@mui/material";
import React, { useEffect } from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header } from "./Header";
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

export function Main(props: { language: string, gitCommitHash: string }) {
  const teamState = useTeamState();
  const admin = window.location.pathname.includes('/admin');

  useEffect(() => {
    void i18next.changeLanguage(props.language);
  }, [props.language])

  return (
    <Layout>
      <LoadTeamState />
      <Header teamName={teamState?.teamName ?? null} admin={admin}/>
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
          maxWidth: "1200px",
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
              <Disclaimer teamName={teamState.teamName} category={teamState.category}/>
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
