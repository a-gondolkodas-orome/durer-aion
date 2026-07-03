import React, { useEffect } from 'react';
import './App.css';
import i18next from "i18next";
import { useTranslation } from 'react-i18next';
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
  const teamState = useTeamState();
  const { t } = useTranslation();

  useEffect(() => {
    i18next.changeLanguage(import.meta.env.VITE_LANGUAGE);
  }, [])

  // The teamName is the join code of the selected test (`<num>_<H|D|O>_<category>`),
  // shown in the header as a translated round name instead of the raw code
  const testTitle = (code: string) => {
    const [num, round, category] = code.split('_');
    const roundType = round === 'D' ? 'final' : round === 'O' ? 'online' : 'local';
    return t(`login.competitionType.${roundType}`, { num, category });
  };

  const titles = ['header.titlePlain', 'header.relayPractise'];
  if (teamState?.teamName) {
    titles.push(testTitle(teamState.teamName));
  }

  return (
    <GameProvider
      value={{
        RelayClient: RelayClient,
    }}>
      <ThemeProvider theme={theme}>
        <ClientRepoProvider 
          value={new OfflineClientRepository()}>
          <Layout>
            <LoadTeamState />
            <Header teamName={teamState?.teamName ?? null} admin={true} titles={titles}/>
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
