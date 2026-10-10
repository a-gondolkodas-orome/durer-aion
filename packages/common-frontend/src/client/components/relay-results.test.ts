import { describe, test, expect } from "vitest";
import type { MyGameState } from "game";
import { formatDuration, relayProblemRows } from "./relay-results";

const answer = (answer: number, date: string) => ({ answer, date });

describe("relayProblemRows", () => {
  test("times each problem from when it appeared, and each try from the one before", () => {
    const G = {
      start: "2026-10-10T10:00:00Z",
      maxPointsList: [3, 4, 5],
      previousPoints: [2, 0],
      previousAnswers: [
        [answer(1, "2026-10-10T10:03:00Z"), answer(2, "2026-10-10T10:04:30Z")],
        [answer(7, "2026-10-10T10:05:00Z"), answer(8, "2026-10-10T10:06:00Z"), answer(9, "2026-10-10T10:06:05Z")],
        [],
      ],
    } as unknown as MyGameState;

    expect(relayProblemRows(G)).toStrictEqual([
      { maxPoints: 3, points: 2, tries: 2, answers: [1, 2], trySeconds: [180, 90] },
      { maxPoints: 4, points: 0, tries: 3, answers: [7, 8, 9], trySeconds: [30, 60, 5] },
      { maxPoints: 5, points: 0, tries: 0, answers: [] },
    ]);
  });
});

describe("formatDuration", () => {
  test("pads the seconds", () => {
    expect(formatDuration(65)).toStrictEqual("1:05");
    expect(formatDuration(600)).toStrictEqual("10:00");
  });
});
