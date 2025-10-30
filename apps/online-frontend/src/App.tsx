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
        <MainWrap />
      </ClientRepoProvider>
    </GameProvider>
  )
}

function MainWrap() {
  const Strategy = React.lazy(() => import('common-frontend/Strategy'));
  const Relay = React.lazy(() => import('common-frontend/Relay'));
  
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Main Strategy={Strategy} Relay={Relay} />
    </React.Suspense>
  )
}

export default App;
