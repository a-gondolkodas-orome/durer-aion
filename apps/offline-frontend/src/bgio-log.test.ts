// @vitest-environment jsdom
import type { LogEntry } from "boardgame.io";
import { beforeEach, describe, expect, test } from "vitest";
import { readPersistedLog } from "./bgio-log";

const KEY = "bgio_stones_e";

function entry(stateID: number): LogEntry {
  return {
    action: { type: "MAKE_MOVE", payload: { type: "takeStone", args: [true], playerID: "0" } },
    _stateID: stateID,
    turn: stateID + 1,
    phase: "play",
  };
}

function persist(matches: [string, LogEntry[]][]) {
  localStorage.setItem(KEY + "_log", JSON.stringify(matches));
}

describe("readPersistedLog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // The bug this replaced (#322) uploaded `{}` for every step, because the
  // reducer's context carries boardgame.io's log *plugin* rather than the
  // entries. These are the entries — the same ones the live round's admin dump
  // reads from the server's storage.
  test("reads the entries boardgame.io persisted for the match", () => {
    persist([["default", [entry(0), entry(1)]]]);

    expect(readPersistedLog(KEY)).toStrictEqual([entry(0), entry(1)]);
  });

  test("reads nothing before the first move is persisted", () => {
    expect(readPersistedLog(KEY)).toStrictEqual([]);
  });

  // Each game has a storage key of its own, so a second match under one key is
  // not a case the dry run reaches — but picking whichever came first would
  // report another game's moves as this one's.
  test("takes the match the client actually plays", () => {
    persist([["other", [entry(7)]], ["default", [entry(0)]]]);

    expect(readPersistedLog(KEY)).toStrictEqual([entry(0)]);
  });

  test("reads a log the client's own game name did not write as empty", () => {
    persist([["default", [entry(0)]]]);

    expect(readPersistedLog("bgio_19ocd_d")).toStrictEqual([]);
  });
});
