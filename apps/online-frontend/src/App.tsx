import React from 'react';
import './App.css';
import { GameProvider } from 'common-frontend';
// import { Main, GameProvider, ClientRepoProvider } from 'common-frontend'
import { RealClientRepository } from './client-repository';

function App() {

  const RelayClient = undefined // React.lazy(() => import(/* webpackChunkName: "react-client" */'./ReactClient').then(module => ({ default: module.RelayClient })));
  const StrategyClient = undefined // React.lazy(() => import(/* webpackChunkName: "react-client" */'./ReactClient').then(module => ({ default: module.StrategyClient })));

  return (
  <GameProvider 
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}><>§</></GameProvider>);/*
  return (
    <GameProvider 
      value={{
        RelayClient: RelayClient,
        StrategyClient: StrategyClient,
    }}>
      <ClientRepoProvider 
        value={new RealClientRepository()}>
        <MainWrap />
      </ClientRepoProvider>
    </GameProvider>
  )*/
}

function MainWrap() {
  const Strategy = React.lazy(() => import('common-frontend/Strategy'));
  const Relay = React.lazy(() => import('common-frontend/Relay'));
  
  /*return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Main Strategy={Strategy} Relay={Relay} />
    </React.Suspense>
  )*/
  return (<></>);
}

export default App;
