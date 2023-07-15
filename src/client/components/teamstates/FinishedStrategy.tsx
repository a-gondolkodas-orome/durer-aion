import React, { useState } from 'react';
import { FinishedMatchStatus, TeamModelDto } from '../../dto/TeamStateDto';
import { Chooser } from '../Chooser';
import { RelayEndTable } from '../RelayEndTable';

/**
 * This component is used by the frontend, to generate a change modal, and a result summary 
 * after a strategy game is finished
 * @param props {{state: TeamModelDto}}
 * @returns 
 */
export function FinishedStrategy(props: {state: TeamModelDto}) {
  const [showEndPage, setShowEndPage] = useState(true)
  return (
    <div data-testId="FinishedStrategyRoot">
      {!showEndPage && <Chooser state={props.state}/>}
      {showEndPage && <RelayEndTable setShow={setShowEndPage} points={(props.state.strategyMatch as FinishedMatchStatus).score}/>}
    </div>
  )
}