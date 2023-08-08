import React, { useState } from 'react';
import { TeamModelDto } from '../../dto/TeamStateDto';
import { Chooser } from '../Chooser';
import { Disclaimer } from '../Disclaimer';

export function Init(props: {state: TeamModelDto}) {
  const [claimed, setClaimed] = useState(props.state.pageState == 'DISCLAIMER')
  return (
    <div data-testId="initRoot">
      {claimed && <Chooser state={props.state}/>}
      {!claimed && <Disclaimer setAccomplished={setClaimed}/>}
    </div>
  )
}