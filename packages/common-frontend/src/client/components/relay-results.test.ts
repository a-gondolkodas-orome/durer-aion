import { describe, test, expect } from "vitest";
import type { MyGameState } from "game";
import { formatDuration, relayProblemDetails } from "./relay-results";

const answer = (answer: number, date: string) => ({ answer, date });

describe("relayProblemDetails", () => {
  test("lists the answers given to each problem", () => {
    const G = {
      start: "2026-10-10T10:00:00Z",
      maxPointsList: [3, 4],
      previousPoints: [2],
      previousAnswers: [[answer(1, "2026-10-10T10:03:00Z"), answer(2, "2026-10-10T10:04:30Z")], []],
    } as unknown as MyGameState;

    expect(relayProblemDetails(G)).toStrictEqual([
      { maxPoints: 3, points: 2, trySeconds: [180, 90], answers: [1, 2] },
      { maxPoints: 4, points: 0, trySeconds: [], answers: [] },
    ]);
  });
});

describe("formatDuration", () => {
  test("pads the seconds", () => {
    expect(formatDuration(65)).toStrictEqual("1:05");
    expect(formatDuration(600)).toStrictEqual("10:00");
  });
});
