import { Container } from '@mui/material';
import React from 'react';
import { LoadUTeamState } from '../hooks/user-atom';
import { useTeamState } from '../hooks/user-hooks';
import { Header } from './Header';
import { Layout } from './layout';
import { Login } from './Login';
import { Finished } from './teamstates/Finished';
import { Init } from './teamstates/Init';
import { Relay } from './teamstates/Relay';
import { Strategy } from './teamstates/Strategy';
import { WaitingRoom } from './WaitingRoom';

// TODO FINISHED, WAITING
export function Main() {
  const teamState = useTeamState();

  return (
    <Layout>
      <LoadUTeamState/>
      <Header teamName={teamState?.teamName ?? null} />
      <Container sx={{ paddingLeft: 0, paddingRight: 0, zIndex: 3, position: 'relative', paddingBottom: '50px', maxWidth: '1200px' }}>
        {!teamState &&
          <Login/>}
        {/* TODO WAITING ROOM when to show? and what is the time?
        teamState?.pageState === "WAITING" &&
          <WaitingRoom/>*/}
        {teamState && teamState?.pageState === "INIT" &&
          <Init state={teamState}/>}
        {teamState && teamState?.pageState === "RELAY" &&
          <Relay state={teamState}/>}
        {teamState && teamState?.pageState === "STRATEGY" &&
          <Strategy state={teamState}/>}
        {teamState && teamState?.pageState === "FINISHED" &&
          <Finished state={teamState}/>}
      </Container>
    </Layout>
  )
}
