import HeapSplitter from './heap-splitter/heap-splitter';
import * as heapSplitterStrategy from './heap-splitter/strategy/strategy';
import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import * as hunyadiAndTheJanissariesStrategy from './hunyadi-and-the-janissaries/strategy/strategy';
import Demonstration from './demonstration/demonstration';
import * as demonstrationStrategy from './demonstration/strategy/strategy';

export const gameComponents = {
  HeapSplitter,
  HunyadiAndTheJanissaries,
  Demonstration
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
  Demonstration: {
    name: 'Demonstráló játék',
    component: 'Demonstration',
    strategy: demonstrationStrategy,
    isHiddenFromOverview: true
  }
};
