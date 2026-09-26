import { describe, expect, it } from "vitest";
import { formatTime } from "./DateFormatter";

describe("formatTime", () => {
  it("zero-pads hours and minutes", () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe("09:05");
    expect(formatTime(new Date(2026, 0, 1, 19, 45))).toBe("19:45");
  });

  it("formats the ISO string a JSON response carries", () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5).toISOString())).toBe("09:05");
  });

  it("throws on an unparseable value", () => {
    expect(() => formatTime("not a date")).toThrow(RangeError);
  });
});
