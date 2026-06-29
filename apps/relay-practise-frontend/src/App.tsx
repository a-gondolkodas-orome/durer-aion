import React, { useEffect } from 'react';
import './App.css';
import i18next from "i18next";
import { GameProvider, ClientRepoProvider, Header, Layout, Login, Relay, useTeamState, LoadTeamState } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';
import { Container } from "@mui/material";
import { LoginToRelay } from './LoginToRelay';


const theme = {
  palette: {
    primary: {
      main: import.meta.env.VITE_ACCENT_COLOR || '#7B021A',
      contrastText: '#f5f5f5',
    },
  },
}

function App() {
  const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
  const StrategyClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.StrategyClient })));
  const teamState = useTeamState();

  useEffect(() => {
    i18next.changeLanguage(import.meta.env.VITE_LANGUAGE);
  }, [])

  return (
    <GameProvider 
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}>
      <ThemeProvider theme={theme}>
        <ClientRepoProvider 
          value={new OfflineClientRepository()}>
          <Layout>
            <LoadTeamState />
            <Header teamName={teamState?.teamName ?? null} admin={true} titles={['header.titlePlain', 'header.relayPractise']}/>
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
              {!teamState && <LoginToRelay />}
              {teamState && <Relay state={teamState}/>}
            </Container>
            <footer style={{
              textAlign: "center",
              color: "#777",
              fontSize: '70%',
              marginBottom: '8px'
            }}>
              <div>{import.meta.env.VITE_GIT_COMMIT_HASH}</div>
            </footer>
          </Layout>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
