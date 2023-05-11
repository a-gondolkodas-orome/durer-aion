import { getGameStateAfterMove, BISHOP, FORBIDDEN } from './strategy';
import { range } from 'lodash-es';

describe('test bishop strategy', () => {
  describe('getGameStateAfterMove', () => {
    it('places bishop at given field and marks forbidden fields', () => {
      const board = range(0, 8).map(() => range(0, 8).map(() => null));
      const res = getGameStateAfterMove(board, { row: 2, col: 3 });
      const expectedBoard = [
        [null     , FORBIDDEN, null     , null  , null     , FORBIDDEN, null     , null     ],
        [null     , null     , FORBIDDEN, null  , FORBIDDEN, null     , null     , null     ],
        [null     , null     , null     , BISHOP, null     , null     , null     , null     ],
        [null     , null     , FORBIDDEN, null  , FORBIDDEN, null     , null     , null     ],
        [null     , FORBIDDEN, null     , null  , null     , FORBIDDEN, null     , null     ],
        [FORBIDDEN, null     , null     , null  , null     , null     , FORBIDDEN, null     ],
        [null     , null     , null,      null  , null     , null     , null     , FORBIDDEN],
        [null     , null     , null     , null  , null     , null     , null     , null     ]
      ];
      expect(res).toEqual({ board: expectedBoard, isGameEnd: false });
    });
  });
});
