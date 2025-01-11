import { generateStartBoard, markForbiddenFields, FORBIDDEN } from "./helpers";

describe('markForbiddenFields', () => {
  it('should mark forbidden fields', () => {
    const board = generateStartBoard();
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
