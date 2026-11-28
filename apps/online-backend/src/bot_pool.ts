import { Worker } from "node:worker_threads";
import type { State } from "boardgame.io";
import type { StrategyAnswer } from "game";

/** How long a worker may take to answer one call before the pool gives up on
 *  it, in milliseconds: twenty times `STRATEGY_BUDGET_MS`, so the budget's
 *  warning comes long before a kill, and still short enough that a team only
 *  sees a slow reply (#875). */
export const STRATEGY_DEADLINE_MS = 2000;

/** What the pool posts a worker: one call of a game's strategy. A match's
 *  state is plain JSON, so it survives the copy into the worker. */
export interface StrategyRequest {
  id: number;
  gameName: string;
  state: State;
  botID: string;
  setupData: unknown;
}

/** What a worker posts back: `ready` once its modules are loaded, then one
 *  answer per request, or the message its strategy threw. */
export type WorkerMessage =
  | { type: "ready" }
  | { type: "answer"; id: number; answer: StrategyAnswer<unknown> }
  | { type: "threw"; id: number; message: string };

/** The pool gave up on a call: the worker missed the deadline or died. The
 *  message says which, in the words the match log takes. A strategy that
 *  throws is not this: its call rejects with the message it threw. */
export class StrategyWorkerFailure extends Error {
  override name = "StrategyWorkerFailure";
}

export interface BotPoolOptions {
  /** The worker's built file, as a path or a file URL. */
  worker: string | URL;
  size?: number;
  deadlineMs?: number;
  /** Handed to every worker; the suites' fixture workers read their part from it. */
  workerData?: unknown;
}

interface Call {
  request: Omit<StrategyRequest, "id">;
  resolve: (answer: StrategyAnswer<unknown>) => void;
  reject: (error: Error) => void;
}

interface Slot {
  worker: Worker;
  ready: boolean;
  busy?: { id: number; call: Call; timer: NodeJS.Timeout };
}

/** A few warm workers that run the bots' strategies off the server's thread,
 *  each call under a deadline (docs/ARCHITECTURE.md § *How the bot gets
 *  its turn* says why). A worker that
 *  misses it is terminated and replaced; a call waits for a free worker, and
 *  its deadline runs from when one takes it. */
export class BotPool {
  private readonly slots = new Set<Slot>();
  private readonly waiting: Call[] = [];
  private nextId = 0;
  private closed = false;
  private readonly size: number;
  private readonly deadlineMs: number;

  constructor(private readonly options: BotPoolOptions) {
    this.size = options.size ?? 2;
    this.deadlineMs = options.deadlineMs ?? STRATEGY_DEADLINE_MS;
  }

  /** Starts the workers and resolves once each has loaded its modules, so the
   *  first call pays for none of it. Rejects if one dies first. */
  async start(): Promise<void> {
    await Promise.all(Array.from({ length: this.size }, () => this.spawn()));
  }

  /** Asks the strategy of `gameName` for the bot's next move. */
  ask(gameName: string, state: State, botID: string, setupData: unknown): Promise<StrategyAnswer<unknown>> {
    if (this.closed) return Promise.reject(new Error("The bot pool is closed."));
    return new Promise((resolve, reject) => {
      this.waiting.push({ request: { gameName, state, botID, setupData }, resolve, reject });
      // Every replacement failed to load: try again, rather than queue behind none.
      if (this.slots.size === 0) this.replace();
      this.dispatch();
    });
  }

  /** Stops every worker; a call still out rejects. */
  async close(): Promise<void> {
    this.closed = true;
    const slots = [...this.slots];
    this.slots.clear();
    for (const call of this.waiting.splice(0)) call.reject(new Error("The bot pool closed."));
    await Promise.all(slots.map(slot => {
      this.settle(slot)?.reject(new StrategyWorkerFailure("was still thinking when the server stopped"));
      return slot.worker.terminate();
    }));
  }

  private spawn(): Promise<void> {
    const worker = new Worker(this.options.worker, { workerData: this.options.workerData });
    const slot: Slot = { worker, ready: false };
    this.slots.add(slot);
    return new Promise((resolve, reject) => {
      worker.on("message", (message: WorkerMessage) => {
        if (message.type === "ready") {
          slot.ready = true;
          resolve();
          this.dispatch();
          return;
        }
        if (slot.busy?.id !== message.id) return;
        const call = this.settle(slot);
        if (message.type === "answer") call?.resolve(message.answer);
        else call?.reject(new Error(message.message));
        this.dispatch();
      });
      // A worker that threw outside a strategy call, or ran out of memory, is
      // gone: `error` comes before `exit`, and `exit` alone after process.exit().
      let crash: string | undefined;
      worker.on("error", (error: Error) => { crash = error.message; });
      worker.on("exit", (code: number) => {
        if (!this.slots.delete(slot)) return;
        const why = crash ?? `exit code ${code}`;
        if (!slot.ready) reject(new Error(`A bot worker died while it loaded: ${why}.`));
        this.settle(slot)?.reject(new StrategyWorkerFailure(`crashed its worker (${why}), which was replaced`));
        this.replace();
      });
    });
  }

  /** A new worker for one that is gone. Calls queue until it is ready; if it
   *  fails to load and no worker is left, they fail rather than wait for ever,
   *  each match's queue behind them. */
  private replace(): void {
    if (this.closed) return;
    this.spawn().catch((error: unknown) => {
      console.error("A replacement bot worker failed to start:", error);
      if ([...this.slots].some(slot => slot.ready)) return;
      for (const call of this.waiting.splice(0)) {
        call.reject(new StrategyWorkerFailure("found no bot worker to run on"));
      }
    });
  }

  /** Frees the slot, and hands back the call it held. */
  private settle(slot: Slot): Call | undefined {
    const busy = slot.busy;
    if (busy === undefined) return undefined;
    clearTimeout(busy.timer);
    slot.busy = undefined;
    return busy.call;
  }

  private dispatch(): void {
    for (const slot of this.slots) {
      if (this.waiting.length === 0) return;
      if (!slot.ready || slot.busy !== undefined) continue;
      const call = this.waiting.shift() as Call;
      const id = this.nextId++;
      const timer = setTimeout(() => {
        // The loop or the slow search goes on in the worker; only ending it
        // gets the thread back.
        this.slots.delete(slot);
        void slot.worker.terminate();
        this.settle(slot)?.reject(
          new StrategyWorkerFailure(`missed its ${this.deadlineMs} ms deadline, and its worker was replaced`));
        this.replace();
      }, this.deadlineMs);
      slot.busy = { id, call, timer };
      const request: StrategyRequest = { id, ...call.request };
      try {
        slot.worker.postMessage(request);
      } catch (error) {
        // A state that is not plain data: the worker never saw it, so it is
        // still free.
        this.settle(slot)?.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}
