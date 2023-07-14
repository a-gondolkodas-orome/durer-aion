import React, { useState } from 'react';
import { FinishedMatchStatus, TeamModelDto } from '../../dto/TeamStateDto';
import { Chooser } from '../Chooser';
import { RelayEndTable } from '../RelayEndTable';

export function FinishedRelay(props: {state: TeamModelDto}) {
  const [showEndPage, setShowEndPage] = useState(true)
  return (
    <>
      {!showEndPage && <Chooser state={props.state}/>}
      {showEndPage && <RelayEndTable setShow={setShowEndPage} points={(props.state.relayMatch as FinishedMatchStatus).score}/>}
    </>
  )
}