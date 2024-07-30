import { getNextSharkPositionByAI } from "./strategy";

describe('getNextSharkPositionByAI', () => {
  it('avoid losing in next step if possible', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ]
    const shark = 4;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(0);
  });

  it('avoid losing in next step by staying in place', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ]
    const shark = 0;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v1', () => {
    const submarines = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 1,
      0, 0, 1, 0
    ]
    const shark = 15;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(15);
  });

  it('stays in place if instant losing otherwise: v2', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 0, 0, 1,
      1, 0, 0, 0,
      0, 0, 0, 0
    ]
    const shark = 3;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(3);
  });

  it('stays in place if instant losing otherwise: v3', () => {
    const submarines = [
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0,
      0, 1, 0, 0
    ]
    const shark = 0;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v4', () => {
    const submarines = [
      0, 1, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 0,
      0, 1, 0, 0
    ]
    const shark = 12;
    const position = getNextSharkPositionByAI(submarines, shark);
    expect(position).toEqual(12);
  });
});
