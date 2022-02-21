import { makeAiMove } from './kupac-ketteoszto/ai-strategy/ai-strategy';
import { isGameEnd, generateNewBoard } from './kupac-ketteoszto/rules/rules';

import KupacKetteoszto from './kupac-ketteoszto/kupac-ketteoszto';
import HunyadiEsAJanicsarok from './hunyadi-es-a-janicsarok/hunyadi-es-a-janicsarok';

export const gameComponents = {
  KupacKetteoszto,
  HunyadiEsAJanicsarok
};

export const gameList = [
  {
    year: 6,
    round: 'döntő',
    category: 'D',
    component: 'HunyadiEsAJanicsarok',
    name: 'Hunyadi és a janicsárok'
  },
  { 
    year: 8,
    round: 'döntő',
    category: 'A',
    component: 'KupacKetteoszto',
    name: 'Kupac kettéosztó',
    strategy: { makeAiMove },
    rules: { isGameEnd, generateNewBoard } 
  }
];