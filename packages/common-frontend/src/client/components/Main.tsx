import { Container } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header } from "./Header";
import { Layout } from "./Layout";
import { Login } from "./Login";
import { Relay } from "./teamstates/Relay";
import { Strategy } from "./teamstates/Strategy";
import { Disclaimer } from "./Disclaimer";
import { Chooser } from "./Chooser";
import { Admin } from "./Admin";
import i18next from "i18next";

export function Main(props: { language: string, gitCommitHash: string }) {
  const teamState = useTeamState();
  const [frontendState, setFrontEndState] = useState<"R" | "S" | null>(null);
  const [admin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    void i18next.changeLanguage(props.language);
  }, [props.language])

  useEffect(() => {
    if (window.location.pathname.includes('/admin')) {
      setAdmin(true);
    } else {
      setAdmin(false);
    }
  }, [])

  return (
    <Layout>
      <LoadTeamState />
      <Header teamName={teamState?.teamName ?? null} admin={admin}/>
      <Container
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
          zIndex: 3,
          position: "relative",
          paddingBottom: "50px",
          maxWidth: "1200px",
        }}
        data-testid="mainRoot"
      >
        {/* The admin page is the page, not a panel above the team's own. These
            used to be independent conditions, so `/admin` also rendered
            whatever the browser's own session was entitled to: the join-code
            login form for an organiser with no team cookie, and a live,
            playable board for one still holding a team's session from
            testing. */}
        {admin ? <Admin teamId={window.location.pathname.split('/').at(2)}/> : <>
          {!teamState && <Login />}
          {teamState && teamState.pageState === "DISCLAIMER" && (
            <Disclaimer teamName={teamState.teamName} category={teamState.category}/>
          )}
          {teamState && teamState.pageState === "HOME" && frontendState === null && (
            <Chooser state={teamState} setState={setFrontEndState}/>
          )}
          {teamState && (
            teamState.pageState === "RELAY" ||
            (teamState.pageState === "HOME" && frontendState === "R")
          ) && (
            <Relay state={teamState} />
          )}
          {teamState && (
            teamState.pageState === "STRATEGY" ||
            (teamState.pageState === "HOME" && frontendState === "S")
          ) && (
            <Strategy state={teamState} />
          )}
        </>}
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
