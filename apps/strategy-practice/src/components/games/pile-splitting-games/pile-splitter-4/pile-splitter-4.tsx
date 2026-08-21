import { strategyGameFactory } from 'strategy-game-factory';
import { BoardClient } from '../board-client';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, generateTestStartBoard, moves } from './gameplay';

const getPlayerStepDescription = () => ({
  hu: 'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'First click the pile you wish to remove, then the disk where you want to split.'
});

const rule = {
  hu: <>
    A pályán kezdetben négy kupac korong van.
    A soron következő játékos először az egyik kupacot teljes egészében kiveszi a játékból;
    majd egy másik kupacot kettéoszt két kisebb kupacra (mindkettőbe legalább 1 korongnak kerülnie kell).
    Egy lépést követően tehát újra 4 kupac marad. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    At the beginning of the game there are 4 piles of disks on the table.
    The player who is in turn takes away a pile, then divides one of the remaining piles into
    two nonempty piles. Whoever is unable to move, loses.
  </>
};

export const PileSplitter4 = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
