import { Container } from "@mui/material";
import React from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header } from "./Header";
import { Layout } from "./layout";
import { Login } from "./Login";
import { Finished } from "./teamstates/Finished";
import { Relay } from "./teamstates/Relay";
import { Strategy } from "./teamstates/Strategy";
import { Disclaimer } from "./Disclaimer";
import { Chooser } from "./Chooser";

// TODO: FINISHED
export function Main() {
  const teamState = useTeamState();
console.log(teamState);
  return (
    <Layout>
      <LoadTeamState />
      <Header teamName={teamState?.teamName ?? null} />
      <Container
        sx={{
          paddingLeft: 0,
          paddingRight: 0,
          zIndex: 3,
          position: "relative",
          paddingBottom: "50px",
          maxWidth: "1200px",
        }}
        data-testId="mainRoot"
      >
        {!teamState && <Login />}
        {teamState && teamState.pageState === "DISCLAIMER" && (
          <Disclaimer />
        )}
        {teamState && teamState.pageState === "HOME" && (
          <Chooser state={teamState} />
        )}
        {teamState && teamState.pageState === "RELAY" && (
          <Relay state={teamState} />
        )}
        {teamState && teamState.pageState === "STRATEGY" && (
          <Strategy state={teamState} />
        )}
        {teamState && teamState.pageState === "FINISHED" && (
          <Finished state={teamState} />
        )}
      </Container>
    </Layout>
  );
}
