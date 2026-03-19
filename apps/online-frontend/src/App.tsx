import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider, GitInfo } from 'common-frontend';
import { RealClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';

const theme = {
  palette: {
    primary: {
      main: import.meta.env.VITE_ACCENT_COLOR || '#11009E',
      contrastText: '#fff',
    },
  },
}

const gitCommitInfo: GitInfo = {
  commitHash: import.meta.env.VITE_GIT_COMMIT_HASH || 'unknown',
};

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
          value={new RealClientRepository()}>
          <Main gitInfo={gitCommitInfo}/>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
