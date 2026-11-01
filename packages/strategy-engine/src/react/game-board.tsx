import React from 'react';

interface GameBoardProps {
  className?: string
  children: React.ReactNode
}

// `isolate` keeps a board's z-indices local to it: a piece layered with `z-50`
// orders against the other pieces only, never against the page's header,
// footer or dialogs, so neither side has to outbid the other.
export const GameBoard = ({ className, children }: GameBoardProps) => {
  return (
    <section className={`isolate p-2 shrink-0 grow basis-2/3 ${className ?? ''}`}>
      {children}
    </section>
  )
}
