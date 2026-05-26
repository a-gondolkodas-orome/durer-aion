import React from 'react';

interface GameBoardProps {
  className?: string
  children: React.ReactNode
}

export const GameBoard = ({ className, children }: GameBoardProps) => {
  return (
    <section className={`p-2 shrink-0 grow basis-2/3 ${className ? `${className}` : ''}`}>
      {children}
    </section>
  )
}
