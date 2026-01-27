import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';

export interface ThemeConfig {
  palette: {
    primary: {
      main: string,
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
      <ThemeProvider<ThemeConfig> theme={{
          palette: {
            primary: {
              main: import.meta.env.VITE_ACCENT_COLOR || '#11009E'
            },
          }
        }}>
        <ClientRepoProvider 
          value={new OfflineClientRepository()}>
          <Main />
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
