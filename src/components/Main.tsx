import { Container } from '@mui/material';
import React from 'react';
import { Layout } from '../client/components/layout';
import { Login } from '../client/components/Login';
import { Finished } from '../client/components/teamsates/Finished';
import { Init } from '../client/components/teamsates/Init';
import { Relay } from '../client/components/teamsates/Relay';
import { Strategy } from '../client/components/teamsates/Strategy';
import { WaitingRoom } from '../client/components/WaitingRoom';
import { LoadUTeamState } from '../client/hooks/user-atom';
import { useTeamState } from '../client/hooks/user-hooks';
import { Header } from './Header';

export function Main() {
  const teamState = useTeamState()

  return (
    <Layout>
      <LoadUTeamState/>
      <Header teamName={teamState?.teamName ?? null} />
      <Container sx={{ paddingLeft: 0, paddingRight: 0, zIndex: 3, position: 'relative', paddingBottom: '50px', maxWidth: '1200px' }}>
        {!teamState &&
          <Login/>}
        {/* TODO WAITING ROOM when to show? and what is the time?
        teamState?.pageState == "WAITING" &&
          <WaitingRoom/>*/}
        {teamState?.pageState == "INIT" &&
          <Init state={teamState}/>}
        {teamState?.pageState == "RELAY" &&
          <Relay state={teamState}/>}
        {teamState?.pageState == "STRATEGY" &&
          <Strategy state={teamState}/>}
        {teamState?.pageState == "FINISHED" &&
          <Finished state={teamState}/>}
      </Container>
    </Layout>
  )
}
