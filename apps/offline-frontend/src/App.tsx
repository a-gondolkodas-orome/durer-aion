import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';

const theme = {
  palette: {
    primary: {
      main: import.meta.env.VITE_ACCENT_COLOR || '#7B021A',
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
          <Main language={import.meta.env.VITE_LANGUAGE}/>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
