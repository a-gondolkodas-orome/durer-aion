import React from 'react';
import { strategyGameFactory } from '../../../game-factory/strategy-game';
import { aiBotStrategy, randomBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';
import { isGameEnd, getWinnerIndex } from './helpers';
import { cloneDeep } from 'lodash';

const generateStartBoard = () => {
  return {
    submarines: [	0, 0, 0, 1, 1,
									0, 0, 0, 1, 1,
									0, 0, 0, 0, 0,
									0, 0, 0, 0, 0,
									0, 0, 0, 0, 0],
    shark: 20,
    turn: 1,
    sharkMovesInTurn: 0
  };
};

const moves = {
  moveSubmarine: (board, { events }, { from, to }) => {
    const nextBoard = cloneDeep(board);
    nextBoard.submarines[from] -= 1;
    nextBoard.submarines[to] += 1;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: getWinnerIndex(nextBoard)})
    }
    return { nextBoard };
  },
  moveShark: (board, { events }, to) => {
    const nextBoard = cloneDeep(board);
    nextBoard.shark = to;

    const isAnotherSharkMoveAllowed = (
      board.submarines[to] === 0 &&
        to !== board.shark &&
        board.sharkMovesInTurn === 0
    )
    if (isAnotherSharkMoveAllowed) {
      nextBoard.sharkMovesInTurn = 1;
      return { nextBoard };
    }

    nextBoard.turn += 1;
    nextBoard.sharkMovesInTurn = 0;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: getWinnerIndex(nextBoard)})
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    Kutatók a Dürerencicás-tóban felfedezték a kihalófélben lévő egyenesenmozgó macskacápa faj
    egy nőstény példányát. Az állat a víz mélyén mozog, így
    befogásához négy tengeralattjárót használnak. A kutatók kommunikálnak egymással
    és látják a cápát, továbbá a cápa is látja a kutatókat. A tó négyzet alakú és
    fel van osztva 5 × 5 darab négyzet alakú szektorra. Minden nap délben az egyik
    tengeralattjáró átúszik egy oldalszomszédos szektorba. A cápa 15 nap múlva nyugodt
    körülmények között tenné le a tojását, így addig menekülni próbál, ehhez minden
    éjszaka legfeljebb kétszer átúszik egy oldalszomszédos szektorba. A kutatók az első
    nap az alábbi kezdőhelyzetből mozognak először. A kutatók akkor nyernek, ha a 15.
    napig valamikor egy tengeralattjáró egy szektorba kerül a cápával, míg a cápa akkor
    nyer, ha még a 15. nap végén is szabad.
  </>,
  en: <>
    Researchers have discovered a female specimen of the endangered straight-swimming catshark
    in Lake Dürerencica. The animal moves in the deep water, so four submarines are used to
    catch it. The researchers communicate with each other and can see the shark, and the shark
    can also see the researchers. The lake is square and divided into 5 × 5 square sectors.
    Each day at noon one submarine moves to an adjacent sector. The shark wants to lay its eggs
    in 15 days under calm conditions, so it tries to escape — each night it may swim through an
    adjacent sector at most twice. The researchers move first from the starting position shown.
    The researchers win if a submarine ever shares a sector with the shark before day 15 ends;
    the shark wins if it is still free at the end of day 15.
  </>
};

const getPlayerStepDescription = ({ board, ctx }) => {
  if (ctx.currentPlayer === 0) {
    return {
      hu: 'Válassz ki egy tengeralattjárót, majd válassz egy szomszédos szektort.',
      en: 'Choose a submarine, then choose an adjacent sector.'
    };
  }
  return {
    hu: <>
      Válassz ki egy cápával oldalszomszédos szektort. Kattints a cápára,
      ha helyben szeretnél maradni.
      <br />
      Ebben a lépésben még legfeljebb{' '}
      <b>{board.sharkMovesInTurn === 0 ? 'kétszer' : 'egyszer'} </b>
      úszhatsz át egy szomszédos szektorba.
    </>,
    en: <>
      Choose a sector adjacent to the shark. Click on the shark to stay in place.
      <br />
      In this move you may swim through an adjacent sector at most{' '}
      <b>{board.sharkMovesInTurn === 0 ? 'twice' : 'once'}</b> more.
    </>
  };
};

export const SharkChase5 = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Kutató', en: "Researcher" },
      { hu: 'Cápa', en: "Shark" }
    ],
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: aiBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
