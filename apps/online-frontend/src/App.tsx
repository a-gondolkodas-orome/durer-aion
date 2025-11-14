import React from 'react';
import './App.css';
import { GameProvider } from 'common-frontend';
// import { Main, GameProvider, ClientRepoProvider } from 'common-frontend'
import { RealClientRepository } from './client-repository';

function App() {

  const RelayClient = React.lazy(() => import(/* webpackChunkName: "react-client" */'./ReactClient').then(module => ({ default: module.RelayClient })));
  const StrategyClient = React.lazy(() => import(/* webpackChunkName: "react-client" */'./ReactClient').then(module => ({ default: module.StrategyClient })));

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


export default App;
