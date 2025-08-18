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

export function Main() {
  const teamState = useTeamState();
  const [frontendState, setFrontEndState] = useState<"R" | "S" | null>(null);
  const [admin, setAdmin] = useState<boolean>(false);

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
        {admin && <Admin teamId={window.location.pathname.split('/').at(2)}/>}
        {!teamState && !admin && <Login />}
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
