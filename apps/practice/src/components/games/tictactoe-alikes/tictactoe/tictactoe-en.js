import React from 'react';

export const rule = <>
  Two players play a game of ordinary tic-tac-toe on a 3 × 3 board with red and
blue disks. That is, if there are three disks of the same colour in a row, column or diagonal,
then the person placing that colour wins. In case no one wins after the placement of the first
9 disks, the subsequent player colours one of the opponent&apos;s already placed disks white. Now
whoever first creates three purple disks in a row, column or diagonal, wins.
</>;

export const stepPlacing = 'Click an empty cell to place a piece.';
export const stepWhitening = 'Click a red piece.';
