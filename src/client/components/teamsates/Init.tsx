import React, { useState } from 'react';
import { TeamModelDto } from '../../dto/TeamStateDto';
import { Chooser } from '../Chooser';
import { Disclaimer } from '../Disclaimer';

export function Init(props: {state: TeamModelDto}) {
  const [claimed, setClaimed] = useState(false)
  return (
    <>
      {claimed && <Chooser state={props.state}/>}
      {!claimed && <Disclaimer setAccomplished={setClaimed}/>}
    </>
  )
}