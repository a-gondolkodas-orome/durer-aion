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

  test("a match saved without the list falls back to the competition relay's points", () => {
    expect(relayTaskPoints({ previousPoints: [3, 1] }).map(task => task.max)).toStrictEqual([3, 3, 4, 4, 4, 5, 5, 6, 6]);
  });
});
