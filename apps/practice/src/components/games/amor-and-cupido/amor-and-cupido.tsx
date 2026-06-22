import { strategyGameFactory, type Ctx, type Events } from '../../game-factory';
import { type Board, completesTriangle, generateStartBoard } from './helpers';
import { smartBotStrategy } from './bot-strategy';
import { BoardClient } from './board-client';

const moves = {
  claimEdge: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }, edge: number) => {
    const nextBoard = board.slice();
    nextBoard[edge] = ctx.currentPlayer;
    if (completesTriangle(board, ctx.currentPlayer!, edge)) {
      events.endGame(ctx.currentPlayer);
    } else {
      events.endTurn();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Cupido és Ámor a következő játékkal ütik el az időt: 6 ember közül felváltva
    kettőt-kettőt egymásba habarítanak. Az a nyertes, aki először létrehoz a saját
    szerelmeiből egy szerelmi háromszöget. Ebben az esetben a szerelem kölcsönös, a
    szerelmi háromszög három emberből áll, akik közül bármely kettő szerelmes egymásba.
  </>,
  en: <>
    Cupid and Amor pass the time with the following game: among 6 people they
    alternately make two of them fall in love with each other. The winner is whoever
    first creates a love triangle from their own loves. In that case the love is
    mutual; a love triangle consists of three people, any two of whom are in love
    with each other.
  </>
};

export const AmorAndCupido = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz két embert, és habarítsd őket egymásba (kösd össze a két pontot).',
      en: 'Pick two people and make them fall in love (connect the two points).'
    })
  },
  BoardClient,
  gameplay: { moves },
  // Smart bot: verified as optimal.
  variants: [{
    botStrategy: smartBotStrategy,
    generateStartBoard
  }]
});
