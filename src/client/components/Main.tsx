import { Container } from '@mui/material';
import React, { useState } from 'react';
import { LoadUTeamState } from '../hooks/user-atom';
import { useTeamState } from '../hooks/user-hooks';
import { Header } from './Header';
import { Layout } from './layout';
import { Login } from './Login';
import { Init } from './teamsates/Init';
import { Relay } from './teamsates/Relay';
import { Strategy } from './teamsates/Strategy';

export function Main() {
  const teamState = useTeamState()
  const [state, setState] = useState("init")
  return (
    <Layout>
      <LoadUTeamState/>
      <Header teamName={teamState?.name ?? null} resetState={setState} />
      <Container sx={{ paddingLeft: 0, paddingRight: 0, zIndex: 3, position: 'relative', paddingBottom: '50px', maxWidth: '1200px' }}>
        {!teamState &&
          <Login/>}
        {teamState && state == "init" &&
          <Init setStarted={setState}/>}
        {teamState && state == "relay" &&
          <Relay state={teamState}/>}
        {teamState && state == "strategias" &&
          <Strategy state={teamState}/>}
      </Container>
    </Layout>
  )
}
