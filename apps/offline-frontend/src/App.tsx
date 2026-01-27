import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';

function App() {
  const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
  const StrategyClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.StrategyClient })));

  return (
    <GameProvider 
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}>
      <ClientRepoProvider 
        value={new OfflineClientRepository()}>
        <ThemeProvider theme={createTheme({
            palette: {
                primary: {
                    main: import.meta.env.VITE_ACCENT_COLOR || '#11009E',
                },
            },
        })}>
          <Main />
        </ThemeProvider>
      </ClientRepoProvider>
    </GameProvider>
  )
}

export default App;
