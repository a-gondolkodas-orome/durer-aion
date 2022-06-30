import HeapSplitter from './heap-splitter/heap-splitter';
import * as heapSplitterStrategy from './heap-splitter/strategy/strategy';
import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import * as hunyadiAndTheJanissariesStrategy from './hunyadi-and-the-janissaries/strategy/strategy';
import Demonstration from './demonstration/demonstration';
import * as demonstrationStrategy from './demonstration/strategy/strategy';
import TwoTimesTwo from './two-times-two/two-times-two';
import * as twoTimesTwoStrategy from './two-times-two/strategy/strategy';
import FiveSquares from './five-squares/five-squares';
import * as fiveSquaresStrategy from './five-squares/strategy/strategy';
import SuperstitiousCounting from './superstitious-counting/superstitious-counting';
import * as superstitiousCountingStrategy from './superstitious-counting/strategy/strategy';
import HeapSplitter4 from './heap-splitter-4/heap-splitter-4';
import * as heapSplitter4Strategy from './heap-splitter-4/strategy/strategy';
import HeapSplitter3 from './heap-splitter-3/heap-splitter-3';
import * as heapSplitter3Strategy from './heap-splitter-3/strategy/strategy';
import TicTacToe from './tictactoe/tictactoe';
import * as ticTacToeStrategy from './tictactoe/strategy/strategy';
import CubeColoring from './cube-coloring/cube-coloring';
import * as cubeColoringStrategy from './cube-coloring/strategy/strategy';
import Coin123 from './coin123/coin123';
import * as coin123Strategy from './coin123/strategy/strategy';

export const gameComponents = {
  HeapSplitter,
  HunyadiAndTheJanissaries,
  Demonstration,
  TwoTimesTwo,
  FiveSquares,
  SuperstitiousCounting,
  HeapSplitter4,
  HeapSplitter3,
  TicTacToe,
  CubeColoring,
  Coin123
};

export const gameList = {
  HunyadiAndTheJanissaries: {
    year: 6,
    round: 'döntő',
    category: 'D',
    component: 'HunyadiAndTheJanissaries',
    name: 'Hunyadi és a janicsárok',
    strategy: hunyadiAndTheJanissariesStrategy
  },
  HeapSplitter: {
    year: 8,
    round: 'döntő',
    category: 'A',
    component: 'HeapSplitter',
    name: 'Kupac kettéosztó',
    strategy: heapSplitterStrategy
  },
  HeapSplitter3: {
    year: 8,
    round: 'döntő',
    category: 'B',
    name: 'Kupac kettéosztó 3 kupaccal',
    component: 'HeapSplitter3',
    strategy: heapSplitter3Strategy
  },
  Demonstration: {
    name: 'Demonstráló játék',
    component: 'Demonstration',
    strategy: demonstrationStrategy,
    isHiddenFromOverview: true
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
    category: 'E',
    name: 'Babonás számoló',
    component: 'SuperstitiousCounting',
    strategy: superstitiousCountingStrategy
  },
  HeapSplitter4: {
    year: 13,
    round: 'döntő',
    category: 'E+',
    name: 'Kupac kettéosztó 4 kupaccal',
    component: 'HeapSplitter4',
    strategy: heapSplitter4Strategy
  },
  CubeColoring: {
    year: 15,
    round: 'döntő',
    category: 'C',
    name: 'Kockaszínezés',
    component: 'CubeColoring',
    isHiddenFromOverview: true,
    strategy: cubeColoringStrategy
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
