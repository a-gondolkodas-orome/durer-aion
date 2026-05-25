import { getOptimalSmartBotMove } from "./bot-strategy";

describe('getOptimalSmartBotMove', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(
      getOptimalSmartBotMove([['rock', 'paper', 'scissor'], ['rock', null, 'scissor']], 0)
    ).toEqual(0);
    expect(
      getOptimalSmartBotMove([['rock', 'paper', 'scissor'], ['rock', 'paper', null]], 0)
    ).toEqual(1);
    expect(
      getOptimalSmartBotMove([['rock', 'paper', 'scissor'], [null, 'paper', 'scissor']], 0)
    ).toEqual(2);
  });

  it('as a second player remove useless piece in second step', () => {
    expect(
      getOptimalSmartBotMove([[null, 'paper', 'scissor'], [null, null, 'scissor']], 0)
    ).toEqual(2);
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(
      getOptimalSmartBotMove([['rock', null, 'scissor'], ['rock', null, 'scissor']], 1)
    ).toEqual(0);
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(
      getOptimalSmartBotMove([['rock', 'paper', null], ['rock', null, 'scissor']], 1)
    ).toEqual(2);
  });
});
