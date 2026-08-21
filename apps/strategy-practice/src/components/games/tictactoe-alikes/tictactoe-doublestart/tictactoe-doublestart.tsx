import { strategyGameFactory } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateEmptyTicTacToeBoard } from '../gameplay';
import { BoardClient } from '../board-client';
import { isDuringFirstMove, moves } from './gameplay';

const getPlayerStepDescription = ({ board }) => {
  return isDuringFirstMove(board)
    ? {
      hu: 'Helyezz le két korongot egy-egy üres mezőre kattintással.',
      en: 'Click two empty cells to place two pieces.'
    }
    : {
      hu: 'Helyezz le egy korongot egy üres mezőre kattintással.',
      en: 'Click an empty cell to place a piece.'
    };
};

const rule = {
  hu: <>
    A 3 × 3-as duplánkezdő amőba játékban először a kezdő tesz le két piros korongot, majd
    a második egy kék korongot és innentől felváltva egy-egy korongot tesznek le a saját színükből, amíg
    be nem telik a tábla. A kezdő nyer, ha a játék végén van valahol három piros egy sorban, oszlopban
    vagy átlóban, de sehol sincs három kék egy sorban, oszlopban vagy átlóban; egyébként a második
    nyer.
  </>,
  en: <>
    In double-starting tic-tac-toe, played on a 3 × 3 board, the first player begins
    by placing two red disks on any two cells. Players then alternate turns,
    each placing one disk on an empty cell — the first player using red disks
    and the second using blue. The game ends when the board is full.
    The first player wins if there are three red disks in a row, column, or diagonal,
    but no three blue disks form such a line. Otherwise, the second player wins.
  </>
};

export const TicTacToeDoubleStart = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    {
      botStrategy: smartBotStrategy,
      startBoards: [generateEmptyTicTacToeBoard()],
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
