import { expect, it } from "vitest";
import type { Ctx } from "boardgame.io";
import { GUESSER_PLAYER, JUDGE_PLAYER, isJudgeToMove } from "./types";

const ctx = (fields: Partial<Ctx>) => ({ currentPlayer: JUDGE_PLAYER, phase: "play", ...fields }) as Ctx;

it("holds for the judge's turn in the phases the bot plays", () => {
  expect(isJudgeToMove(ctx({}))).toBe(true);
  expect(isJudgeToMove(ctx({ phase: "startNewGame" }))).toBe(true);
});

it("does not hold on the team's turn, in another phase, or once the match is over", () => {
  expect(isJudgeToMove(ctx({ currentPlayer: GUESSER_PLAYER }))).toBe(false);
  expect(isJudgeToMove(ctx({ phase: "chooseRole" }))).toBe(false);
  expect(isJudgeToMove(ctx({ gameover: { winner: GUESSER_PLAYER } }))).toBe(false);
});
