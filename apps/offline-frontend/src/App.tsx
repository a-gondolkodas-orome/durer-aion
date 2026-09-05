import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';

// Branding, not configuration: every build of this app uses these, so they live
// in git rather than in a gitignored `.env` that goes stale when the sample
// changes (#443).
const ACCENT_COLOR = '#7B021A';
const LANGUAGE = 'hu';

const theme = {
  palette: {
    primary: {
      main: ACCENT_COLOR,
      contrastText: '#fff',
    },
  },
}

function App() {
  const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
  const StrategyClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.StrategyClient })));

  return (
    <GameProvider
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}>
      <ThemeProvider theme={theme}>
        <ClientRepoProvider
          value={new OfflineClientRepository()}>
          <Main language={LANGUAGE} gitCommitHash={import.meta.env.VITE_GIT_COMMIT_HASH}/>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
