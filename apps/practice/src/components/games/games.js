import Demonstration from './demonstration/demonstration';
import * as demonstrationStrategy from './demonstration/strategy/strategy';
import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import * as hunyadiAndTheJanissariesStrategy from './hunyadi-and-the-janissaries/strategy/strategy';
import TwoTimesTwo from './two-times-two/two-times-two';
import * as twoTimesTwoStrategy from './two-times-two/strategy/strategy';
import FiveSquares from './five-squares/five-squares';
import * as fiveSquaresStrategy from './five-squares/strategy/strategy';
import SuperstitiousCounting from './superstitious-counting/superstitious-counting';
import * as superstitiousCountingStrategy from './superstitious-counting/strategy/strategy';
import PileSplitter from './pile-splitting-games/pile-splitter/pile-splitter';
import * as pileSplitterStrategy from './pile-splitting-games/pile-splitter/strategy/strategy';
import PileSplitter3 from './pile-splitting-games/pile-splitter-3/pile-splitter-3';
import * as pileSplitter3Strategy from './pile-splitting-games/pile-splitter-3/strategy/strategy';
import PileSplitter4 from './pile-splitting-games/pile-splitter-4/pile-splitter-4';
import * as pileSplitter4Strategy from './pile-splitting-games/pile-splitter-4/strategy/strategy';
import CubeColoring from './cube-coloring/cube-coloring';
import * as cubeColoringStrategy from './cube-coloring/strategy/strategy';
import Coin123 from './coin123/coin123';
import * as coin123Strategy from './coin123/strategy/strategy';
import Coin357 from './coin357/coin357';
import * as coin357Strategy from './coin357/strategy/strategy';
import TicTacToe from './tictactoe-alikes/tictactoe/tictactoe';
import * as ticTacToeStrategy from './tictactoe-alikes/tictactoe/strategy/strategy';
import TicTacToeDoubleStart from './tictactoe-alikes/tictactoe-doublestart/tictactoe-doublestart';
import * as ticTacToeDoubleStartStrategy from './tictactoe-alikes/tictactoe-doublestart/strategy/strategy';
import AntiTicTacToe from './tictactoe-alikes/anti-tictactoe/anti-tictactoe';
import * as antiTicTacToeStrategy from './tictactoe-alikes/anti-tictactoe/strategy/strategy';
import ChessRook from './chess-rook/chess-rook';
import * as chessRookStrategy from './chess-rook/strategy/strategy';
import ChessBishops from './chess-bishops/chess-bishops';
import * as chessBishopsStrategy from './chess-bishops/strategy/strategy';


export const gameComponents = {
  Demonstration,
  HunyadiAndTheJanissaries,
  TwoTimesTwo,
  FiveSquares,
  SuperstitiousCounting,
  PileSplitter,
  PileSplitter3,
  PileSplitter4,
  CubeColoring,
  Coin123,
  Coin357,
  TicTacToe,
  TicTacToeDoubleStart,
  AntiTicTacToe,
  ChessRook,
  ChessBishops
};

export const gameList = {
  ChessBishops: {
    year: 1,
    round: 'döntő',
    category: 'B',
    component: 'ChessBishops',
    name: 'Sakktáblán futók',
    strategy: chessBishopsStrategy
  },
  ChessRook: {
    year: 1,
    round: 'döntő',
    category: 'C',
    component: 'ChessRook',
    name: 'Sakktáblán egy bástya',
    strategy: chessRookStrategy
  },
  HunyadiAndTheJanissaries: {
    year: 6,
    round: 'döntő',
    category: 'D',
    component: 'HunyadiAndTheJanissaries',
    name: 'Hunyadi és a janicsárok',
    strategy: hunyadiAndTheJanissariesStrategy
  },
  PileSplitter: {
    year: 8,
    round: 'döntő',
    category: 'A',
    component: 'PileSplitter',
    name: 'Kupac kettéosztó',
    strategy: pileSplitterStrategy
  },
  PileSplitter3: {
    year: 8,
    round: 'döntő',
    category: 'B',
    name: 'Kupac kettéosztó 3 kupaccal',
    component: 'PileSplitter3',
    strategy: pileSplitter3Strategy
  },
  Demonstration: {
    name: 'Demonstráló játék',
    component: 'Demonstration',
    strategy: demonstrationStrategy,
    isHiddenFromOverview: true
  },
  TicTacToeDoubleStart: {
    year: 12,
    round: 'döntő',
    category: 'A',
    name: 'Duplán kezdő 3x3 amőba',
    component: 'TicTacToeDoubleStart',
    strategy: ticTacToeDoubleStartStrategy
  },
  AntiTicTacToe: {
    year: 12,
    round: 'döntő',
    category: 'B',
    name: '3x3 Anti-amőba',
    component: 'AntiTicTacToe',
    strategy: antiTicTacToeStrategy
  },
  TwoTimesTwo: {
    year: 13,
    round: 'döntő',
    category: 'A',
    name: '2x2-es játék',
    component: 'TwoTimesTwo',
    strategy: twoTimesTwoStrategy
  },
  FiveSquares: {
    year: 13,
    round: 'döntő',
    category: 'B',
    name: '5 mezős játék',
    component: 'FiveSquares',
    strategy: fiveSquaresStrategy
  },
  TicTacToe: {
    year: 13,
    round: 'döntő',
    category: 'C',
    name: 'Átszínezős Tic Tac Toe',
    component: 'TicTacToe',
    strategy: ticTacToeStrategy
  },
  SuperstitiousCounting: {
    year: 13,
    round: 'döntő',
    category: 'D,E',
    name: 'Babonás számoló',
    component: 'SuperstitiousCounting',
    strategy: superstitiousCountingStrategy
  },
  PileSplitter4: {
    year: 13,
    round: 'döntő',
    category: 'E+',
    name: 'Kupac kettéosztó 4 kupaccal',
    component: 'PileSplitter4',
    strategy: pileSplitter4Strategy
  },
  CubeColoring: {
    year: 15,
    round: 'döntő',
    category: 'C',
    name: 'Kockaszínezés',
    component: 'CubeColoring',
    strategy: cubeColoringStrategy
  },
  Coin357: {
    year: 15,
    round: 'döntő',
    category: 'A',
    name: '3 db 1, 5 db 2 és 7 db 3 pengős',
    component: 'Coin357',
    strategy: coin357Strategy
  },
  Coin123: {
    year: 15,
    round: 'döntő',
    category: 'B',
    name: '3, 2, 1 érmék',
    component: 'Coin123',
    strategy: coin123Strategy
  }
};
