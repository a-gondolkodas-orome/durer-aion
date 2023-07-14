import React, { useState } from 'react';
import { FinishedMatchStatus, TeamModelDto } from '../../dto/TeamStateDto';
import { Chooser } from '../Chooser';
import { RelayEndTable } from '../RelayEndTable';
/**
 * This component is used by the frontend, to generate a change modal, and a result summary 
 * after a relay game is finished
 * @param props {{state: TeamModelDto}}
 * @returns 
 */
export function FinishedRelay(props: {state: TeamModelDto}) {
  const [showEndPage, setShowEndPage] = useState(true)
  return (
    <>
      {!showEndPage && <Chooser state={props.state}/>}
      {showEndPage && <RelayEndTable setShow={setShowEndPage} points={(props.state.relayMatch as FinishedMatchStatus).score}/>}
    </>
  )
}