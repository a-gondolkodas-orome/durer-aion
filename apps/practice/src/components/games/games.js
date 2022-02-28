import KupacKetteoszto from './kupac-ketteoszto/kupac-ketteoszto';
import * as kupacKetteosztoStrategy from './kupac-ketteoszto/strategy/strategy';
import HunyadiEsAJanicsarok from './hunyadi-es-a-janicsarok/hunyadi-es-a-janicsarok';
import * as hunyadiEsAJanicsarokStrategy from './hunyadi-es-a-janicsarok/strategy/strategy';

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
    name: 'Hunyadi és a janicsárok',
    strategy: hunyadiEsAJanicsarokStrategy
  },
  {
    year: 8,
    round: 'döntő',
    category: 'A',
    component: 'KupacKetteoszto',
    name: 'Kupac kettéosztó',
    strategy: kupacKetteosztoStrategy
  }
];
