import { describe, test, expect } from "vitest";
import { formatJoinCode } from "./join-code";

describe("formatJoinCode", () => {
  test("groups a full code 3-4-3", () => {
    expect(formatJoinCode("1112222333")).toBe("111-2222-333");
  });

  test("dashes a group only once it has begun", () => {
    expect(formatJoinCode("")).toBe("");
    expect(formatJoinCode("111")).toBe("111");
    expect(formatJoinCode("1112")).toBe("111-2");
    expect(formatJoinCode("1112222")).toBe("111-2222");
    expect(formatJoinCode("11122223")).toBe("111-2222-3");
  });

  test("keeps an already formatted code as it is", () => {
    expect(formatJoinCode("111-2222-333")).toBe("111-2222-333");
  });

  test("drops anything but digits, and digits past the tenth", () => {
    expect(formatJoinCode(" 111 2222 333 ")).toBe("111-2222-333");
    expect(formatJoinCode("a1b1c1-")).toBe("111");
    expect(formatJoinCode("111222233344")).toBe("111-2222-333");
  });
});
