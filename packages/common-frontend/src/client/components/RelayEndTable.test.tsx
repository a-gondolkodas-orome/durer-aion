import { describe, test, expect } from "vitest";
import { relayTaskPoints } from "./RelayEndTable";

describe("relayTaskPoints", () => {
  test("lists every problem of the set, the ones not reached without points", () => {
    expect(relayTaskPoints({ maxPointsList: [2, 3, 4], previousPoints: [2, 0] })).toStrictEqual([
      { max: 2, got: 2 },
      { max: 3, got: 0 },
      { max: 4, got: null },
    ]);
  });

  test("a match saved without the list shows the answered problems, max unknown", () => {
    expect(relayTaskPoints({ previousPoints: [3, 1] })).toStrictEqual([
      { max: null, got: 3 },
      { max: null, got: 1 },
    ]);
  });
});
