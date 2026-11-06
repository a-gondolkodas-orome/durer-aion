import { describe, test, expect } from "vitest";
import { formatDuration } from "./relay-results";

describe("formatDuration", () => {
  test("pads the seconds", () => {
    expect(formatDuration(65)).toStrictEqual("1:05");
    expect(formatDuration(600)).toStrictEqual("10:00");
  });
});
