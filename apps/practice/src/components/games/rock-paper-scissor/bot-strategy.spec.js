import { getOptimalAiMove } from "./bot-strategy";

describe('getOptimalAiMove', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(
      getOptimalAiMove([['r', 'p', 's'], ['r', null, 's']], 0)
    ).toEqual(0);
    expect(
      getOptimalAiMove([['r', 'p', 's'], ['r', 'p', null]], 0)
    ).toEqual(1);
    expect(
      getOptimalAiMove([['r', 'p', 's'], [null, 'p', 's']], 0)
    ).toEqual(2);
  });

  it('as a second player remove useless piece in second step', () => {
    expect(
      getOptimalAiMove([[null, 'p', 's'], [null, null, 's']], 0)
    ).toEqual(2);
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(
      getOptimalAiMove([['r', null, 's'], ['r', null, 's']], 1)
    ).toEqual(0);
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(
      getOptimalAiMove([['r', 'p', null], ['r', null, 's']], 1)
    ).toEqual(2);
  });
});
