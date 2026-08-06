import { strategyGameFactory, type Ctx } from '../../../strategy-game-factory';
import { POLICE, generateStartBoardA, generateStartBoardB, moves, type Board } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const ruleA = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket
    pöttyök jelölik. A játék kezdetén a számítógép az egyik útkereszteződésbe
    letesz egy tolvajt ábrázoló (piros) korongot, egy másikba pedig két
    rendőrt ábrázoló (kék illetve zöld) korongot. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd
    a tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet
    változtatnia. A rendőrök nyernek, ha a tolvaj
    bármikor azonos kereszteződésben van egy rendőrrel. A tolvaj nyer, ha a
    harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places a thief (red) piece at one intersection and two policemen (blue and green)
    at another. Each round the policemen move first (blue then green), each stepping to an adjacent
    intersection along a road (they may split up), then the thief moves the same way. Everyone must
    move every round. The policemen win if the thief is ever at the same intersection as a policeman.
    The thief wins if they are not caught by the end of the third round.
  </>
};

const ruleB = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket pöttyök
    jelölik. A játék kezdetén a számítógép valamely útkereszteződésekbe leteszi a tolvajt
    ábrázoló (piros), valamint a két rendőrt ábrázoló (kék illetve zöld) korongokat; a két rendőr
    esetleg ugyanarra a mezőre is kerülhet. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd a
    tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet változtatnia.
    A rendőrök nyernek, ha a tolvaj bármikor azonos kereszteződésben van egy rend-
    őrrel. A tolvaj nyer, ha a harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places the thief (red) and the two policemen (blue and green) at intersections of
    their choosing; the two policemen may start on the same intersection. Each round the policemen
    move first (blue then green), each stepping to an adjacent intersection along a road (they may
    split up), then the thief moves the same way. Everyone must move every round. The policemen win
    if the thief is ever at the same intersection as a policeman. The thief wins if they are not
    caught by the end of the third round.
  </>
}

const getPlayerStepDescription = ({ board, ctx }: { board: Board; ctx: Ctx }) => {
  if (ctx.currentPlayer === POLICE) {
    return {
      hu: `Kattints arra az útkereszteződésre, ahová a ` +
        `${board.firstPolicemanMoved ? 'zöld' : 'kék'} rendőrrel lépni szeretnél.`,
      en: `Click the intersection you want to move the ` +
        `${board.firstPolicemanMoved ? 'green' : 'blue'} policeman to.`
    };
  } else {
    return {
      hu: 'Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.',
      en: 'Click the intersection you want to move the thief to.'
    };
  }
}

const roleLabels: [{ hu: string; en: string }, { hu: string; en: string }] = [
  { hu: 'Rendőrök', en: 'Policemen' },
  { hu: 'Tolvaj', en: 'Thief' }
];

// A and B are the same game; they differ only in the start position (in A the two
// policemen always start on the same intersection, in B they may start apart) and
// the corresponding rule wording. Exposed as two variants of one game.
export const Policemanthief = strategyGameFactory({
  presentation: {
    rule: ruleA,
    roleLabels,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardA,
      label: { hu: 'Együtt (A)', en: 'Together (A)' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoardB,
      rule: ruleB,
      label: { hu: 'Külön (B)', en: 'Apart (B)' }
    }
  ]
});
