import { Container } from "@mui/material";
import React, { useState } from "react";
import { useTeamState, LoadTeamState } from "../hooks/user-hooks";
import { Header } from "./Header";
import { Layout } from "./layout";
import { Login } from "./Login";
import { Relay } from "./teamstates/Relay";
import { Strategy } from "./teamstates/Strategy";
import { Disclaimer } from "./Disclaimer";
import { Chooser } from "./Chooser";

export function Main() {
  const teamState = useTeamState();
  const [frontendState, setFrontEndState] = useState<"R" | "S" | null>(null);

  return (
    <Layout>
      <LoadTeamState />
      <Header teamName={teamState?.teamName ?? null} />
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
        data-testId="mainRoot"
      >
        {!teamState && <Login />}
        {teamState && teamState.pageState === "DISCLAIMER" && (
          <Disclaimer />
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
      </Container>
    </Layout>
  );
}
