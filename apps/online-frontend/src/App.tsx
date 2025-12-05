import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { RealClientRepository } from './client-repository';

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
        value={new RealClientRepository()}>
        <Main />
      </ClientRepoProvider>
    </GameProvider>
  )
}

export default App;
