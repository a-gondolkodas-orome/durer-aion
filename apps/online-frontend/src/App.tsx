import React from 'react';
import './App.css';
import { Main, GameProvider, ClientRepoProvider } from 'common-frontend';
import { RelayClient, StrategyClient } from './ReactClient';
import { RealClientRepository } from './client-repository';

function App() {

  return (
    <GameProvider 
      value={{
        RelayClient: <RelayClient />,
        StrategyClient: <StrategyClient />,
    }}>
      <ClientRepoProvider 
        value={new RealClientRepository()}>
        <Main />
      </ClientRepoProvider>
    </GameProvider>
  )
}

export default App;
