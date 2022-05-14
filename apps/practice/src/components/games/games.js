import HeapSplitter from './heap-splitter/heap-splitter';
import * as heapSplitterStrategy from './heap-splitter/strategy/strategy';
import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import * as hunyadiAndTheJanissariesStrategy from './hunyadi-and-the-janissaries/strategy/strategy';

export const gameComponents = {
  HeapSplitter,
  HunyadiAndTheJanissaries
};

export const gameList = [
  {
    year: 6,
    round: 'döntő',
    category: 'D',
    component: 'HunyadiAndTheJanissaries',
    name: 'Hunyadi és a janicsárok',
    strategy: hunyadiAndTheJanissariesStrategy
  },
  {
    year: 8,
    round: 'döntő',
    category: 'A',
    component: 'HeapSplitter',
    name: 'Kupac kettéosztó',
    strategy: heapSplitterStrategy
  }
];
