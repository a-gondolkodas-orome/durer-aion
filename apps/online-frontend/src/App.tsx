import React from 'react';
import { Main, GameProvider, ClientRepoProvider, AdminRepoProvider } from 'common-frontend';
import { RealClientRepository } from './client-repository';
import { tracker } from './tracking';
import { ThemeProvider } from '@mui/material/styles';

// Branding, not configuration: every build of this app uses these, so they live
// in git rather than in a gitignored `.env` that goes stale when the sample
// changes (#443).
const ACCENT_COLOR = '#11009E';
const LANGUAGE = 'hu';

const theme = {
  palette: {
    primary: {
      main: ACCENT_COLOR,
      contrastText: '#fff',
    },
  },
}

// Module scope, not component scope: a lazy component or repository created in
// App's body would get a new identity on every render, remounting the game
// client under it.
const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
const StrategyClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.StrategyClient })));
const clientRepository = new RealClientRepository(tracker);

function App() {
  return (
    <GameProvider
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}>
      <ThemeProvider theme={theme}>
        <ClientRepoProvider
          value={clientRepository}>
          <AdminRepoProvider value={clientRepository}>
            <Main language={LANGUAGE} gitCommitHash={import.meta.env.VITE_GIT_COMMIT_HASH}/>
          </AdminRepoProvider>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
