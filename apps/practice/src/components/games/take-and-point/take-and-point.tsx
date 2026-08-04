import { strategyGameFactory } from '../../strategy-game-factory';
import { BoardClient } from './board-client';
import { generateStartBoard, moves, nonEmptyIndices } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

const rule = {
  hu: <>
    A játék elején néhány kupacban kavicsok vannak. Egy játékos körében az alábbi két dolog történik
    egymás után: a másik játékos rámutat a kupacok közül kettőre (ha már csak egy van, akkor arra az
    egyre), majd a soron lévő játékos az egyik megjelölt kupacból elvesz néhány kavicsot (legalább
    egyet, akár az összeset is). Az nyer, aki az utolsó kavicsot elveszi.
  </>,
  en: <>
    At the start of the game there are stones in a few piles. On a player's turn, two things happen in
    sequence: the other player points at two of the piles (or, if only one pile is left, at that one),
    then the player on turn removes some stones from one of the pointed piles (at least one, possibly
    all of them). Whoever takes the last stone wins.
  </>
};

export const TakeAndPoint = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Először mutatok', en: 'I point first' },
      { hu: 'Először veszek', en: 'I take first' }
    ],
    getPlayerStepDescription: ({ board }) => {
      if (board.pointed === null) {
        return nonEmptyIndices(board.piles).length === 1
          ? {
            hu: 'Mutass rá az egyetlen megmaradt kupacra a másik játékosnak.',
            en: 'Point at the only remaining pile for the other player.'
          }
          : {
            hu: 'Mutass rá két kupacra, amelyek közül a másik játékos választhat.',
            en: 'Point at two piles for the other player to choose from.'
          };
      }
      return {
        hu: 'Vegyél el néhány kavicsot az egyik megjelölt kupacból.',
        en: 'Take some stones from one of the pointed piles.'
      };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal (see bot-strategy.spec.ts)
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
