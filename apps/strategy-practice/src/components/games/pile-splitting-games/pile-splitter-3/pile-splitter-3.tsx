import { strategyGameFactory } from 'strategy-game-factory';
import { BoardClient } from '../board-client';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { generateStartBoard, moves } from './gameplay';

const getPlayerStepDescription = () => ({
  hu: 'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.',
  en: 'First click the pile to remove, then click the piece where you want to split another pile.'
});

const rule = {
  hu: <>
    A pályán kezdetben 37 korong van, három kupacban.
    A soron következő játékos először az egyik kupacot teljes egészében kiveszi a játékból;
    majd egy másik kupacot kettéoszt két kisebb kupacra (mindkettőbe legalább 1 korongnak kerülnie kell).
    Egy lépést követően tehát újra három kupac marad. Az veszít, aki nem tud lépni.
  </>,
  en: <>
    There are 37 pieces on the board at the start, in three piles. The current player first removes
    one pile entirely from the game, then splits another pile into two smaller piles (each must
    contain at least 1 piece). After each move there are again three piles. The player who cannot
    move loses.
  </>
};

export const PileSplitter3 = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
