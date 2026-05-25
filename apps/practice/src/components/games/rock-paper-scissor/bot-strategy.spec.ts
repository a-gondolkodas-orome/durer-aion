import { getOptimalAiMove } from "./bot-strategy";

describe('getOptimalAiMove', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(
      getOptimalAiMove([['rock', 'paper', 'scissor'], ['rock', null, 'scissor']], 0)
    ).toEqual(0);
    expect(
      getOptimalAiMove([['rock', 'paper', 'scissor'], ['rock', 'paper', null]], 0)
    ).toEqual(1);
    expect(
      getOptimalAiMove([['rock', 'paper', 'scissor'], [null, 'paper', 'scissor']], 0)
    ).toEqual(2);
  });

  it('as a second player remove useless piece in second step', () => {
    expect(
      getOptimalAiMove([[null, 'paper', 'scissor'], [null, null, 'scissor']], 0)
    ).toEqual(2);
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(
      getOptimalAiMove([['rock', null, 'scissor'], ['rock', null, 'scissor']], 1)
    ).toEqual(0);
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(
      getOptimalAiMove([['rock', 'paper', null], ['rock', null, 'scissor']], 1)
    ).toEqual(2);
  });
});
