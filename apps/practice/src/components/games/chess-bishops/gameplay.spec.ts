import { FORBIDDEN, startBoard, getAllowedMoves, markForbiddenFields, moves } from './gameplay';
import { makeCtx } from 'test-utils';

describe('markForbiddenFields', () => {
  it('should mark forbidden fields', () => {
    const board = startBoard;
    markForbiddenFields(board, { row: 2, col: 3 });
    const expectedBoard = [
      [null     , FORBIDDEN, null     , null  , null     , FORBIDDEN, null     , null     ],
      [null     , null     , FORBIDDEN, null  , FORBIDDEN, null     , null     , null     ],
      [null     , null     , null     , FORBIDDEN, null  , null     , null     , null     ],
      [null     , null     , FORBIDDEN, null  , FORBIDDEN, null     , null     , null     ],
      [null     , FORBIDDEN, null     , null  , null     , FORBIDDEN, null     , null     ],
      [FORBIDDEN, null     , null     , null  , null     , null     , FORBIDDEN, null     ],
      [null     , null     , null,      null  , null     , null     , null     , FORBIDDEN],
      [null     , null     , null     , null  , null     , null     , null     , null     ]
    ];
    expect(board).toEqual(expectedBoard);
  });
});

// Bishops fill the board until no unattacked square is left; the player who
// takes the last one wins. Hand-building a saturated 8x8 board would obscure
// more than it shows, so the test plays one out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the placement that saturates the board', () => {
    let board = startBoard;
    let player = 0;
    let outcome = moves.placeBishop.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeBishop.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
