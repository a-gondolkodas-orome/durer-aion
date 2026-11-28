import { join } from "node:path";
import type { State } from "boardgame.io";
import { BotPool, StrategyWorkerFailure } from "./bot_pool";

/** The fixture in its echo mode: what each call does is in its `G`. */
const FIXTURE = join(__dirname, "fixtures", "strategy_worker.mjs");

/** Short, so a test of a missed deadline takes a fraction of a second. */
const DEADLINE_MS = 300;

const stateOf = (G: Record<string, unknown>) => ({ G }) as unknown as State;

describe("the bot pool", () => {
  let pool: BotPool;

  beforeEach(async () => {
    pool = new BotPool({ worker: FIXTURE, deadlineMs: DEADLINE_MS, workerData: { mode: "echo" } });
    await pool.start();
  });

  afterEach(async () => {
    await pool.close();
  });

  const ask = (G: Record<string, unknown>) => pool.ask("a game", stateOf(G), "1", undefined);

  it("answers with the strategy's move and how long it took", async () => {
    const answer = await ask({ n: 7, sleepMs: 20 });

    expect(answer.move).toStrictEqual([[7], "echo"]);
    expect(answer.strategyMs).toBeGreaterThanOrEqual(20);
  });

  it("answers one call while another is still thinking", async () => {
    const slow = ask({ n: 1, sleepMs: 250 });
    const started = Date.now();

    await ask({ n: 2 });

    expect(Date.now() - started).toBeLessThan(150);
    expect((await slow).move).toStrictEqual([[1], "echo"]);
  });

  it("gives up on a strategy that loops, and answers the next call from a fresh worker", async () => {
    const started = Date.now();

    await expect(ask({ loop: true })).rejects.toThrow(
      new StrategyWorkerFailure(`missed its ${DEADLINE_MS} ms deadline, and its worker was replaced`));
    expect(Date.now() - started).toBeLessThan(DEADLINE_MS + 200);

    // Both at once: two workers again, neither of them the one that looped.
    const answers = await Promise.all([ask({ n: 3 }), ask({ n: 4 })]);
    expect(answers.map(({ move }) => move)).toStrictEqual([[[3], "echo"], [[4], "echo"]]);
  });

  it("fails a call whose worker crashes as it fails one that times out, and replaces the worker", async () => {
    const failed = ask({ crash: true });

    await expect(failed).rejects.toBeInstanceOf(StrategyWorkerFailure);
    await expect(failed).rejects.toThrow(/crashed its worker \(the worker fell over\), which was replaced/);
    const answers = await Promise.all([ask({ n: 5 }), ask({ n: 6 })]);
    expect(answers.map(({ move }) => move)).toStrictEqual([[[5], "echo"], [[6], "echo"]]);
  });

  it("rejects with what a strategy threw, and keeps its worker", async () => {
    const failed = ask({ throw: "no entry for this position" });

    await expect(failed).rejects.toThrow("no entry for this position");
    await expect(failed).rejects.not.toBeInstanceOf(StrategyWorkerFailure);
    expect((await ask({ n: 8 })).move).toStrictEqual([[8], "echo"]);
  });

  it("queues calls beyond its workers, each under its own deadline", async () => {
    // Two calls fill both workers; the third waits, and its deadline starts
    // only once a worker takes it.
    const answers = await Promise.all([200, 200, 200].map((sleepMs, n) => ask({ n, sleepMs })));

    expect(answers.map(({ move }) => move)).toStrictEqual([[[0], "echo"], [[1], "echo"], [[2], "echo"]]);
  });
});
