import React, { useEffect } from 'react';
import i18next from "i18next";
import { useTranslation } from 'react-i18next';
import { GameProvider, ClientRepoProvider, Header, Layout, Relay, useTeamState, LoadTeamState } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';
import { Container } from "@mui/material";
import { LoginToRelay } from './LoginToRelay';


const theme = {
  palette: {
    primary: {
      main: import.meta.env.VITE_ACCENT_COLOR || '#9F0712',
      contrastText: '#f5f5f5',
    },
  },
}

// Module scope, not component scope: App re-renders on every teamState change,
// and a lazy component or repository created in its body would get a new
// identity each time — remounting the whole game client after every answer.
const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
const clientRepository = new OfflineClientRepository();

function App() {
  // There is no real login here: the round selector stores the chosen test as
  // the "logged in team", which is what drives the header title below and the
  // switch between the selector and the game.
  const teamState = useTeamState();
  const { t } = useTranslation();

  useEffect(() => {
    void i18next.changeLanguage(import.meta.env.VITE_LANGUAGE);
  }, [])

  // The teamName is the join code of the selected test (`<num>_<H|D|O>_<category>`),
  // shown in the header as a translated round name instead of the raw code
  const testTitle = (code: string) => {
    const [num, round, category] = code.split('_');
    const roundType = round === 'D' ? 'final' : round === 'O' ? 'online' : 'local';
    // t('login.competitionType.local'), t('login.competitionType.final'), t('login.competitionType.online');
    return t(`login.competitionType.${roundType}`, { num, category });
  };

  // t('header.titlePlain'), t('header.relayPractise');
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
          value={clientRepository}>
          <Layout>
            <LoadTeamState />
            <Header teamName={teamState?.teamName ?? null} admin={true} titles={titles} homeAddress='/..'/>
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
