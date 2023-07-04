import React, { useState } from 'react';
import { Chooser } from '../Chooser';
import { Disclaimer } from '../Disclaimer';

export function Init(props: {setStarted: React.Dispatch<string>}) {
  const [claimed, setClaimed] = useState(false)
  return (
    <>
      {claimed && <Chooser setStarted={props.setStarted}/>}
      {!claimed && <Disclaimer setAccomplished={setClaimed}/>}
    </>
  )
}