// The bot worker: runs the strategies off the server's thread, one call at a
// time, for bot_pool.ts. Built beside server.js (tsdown.config.mts).
import { parentPort } from "node:worker_threads";
import { runStrategy } from "game";
import { hostedStrategies } from "./strategies";
import type { StrategyRequest, WorkerMessage } from "./bot_pool";

const port = parentPort;
if (port === null) throw new Error("bot_worker.js runs as a worker thread of the server, not on its own.");

const strategies = hostedStrategies();

port.on("message", ({ id, gameName, state, botID, setupData }: StrategyRequest) => {
  let reply: WorkerMessage;
  try {
    const strategy = strategies[gameName];
    if (strategy === undefined) throw new Error(`no strategy plays ${JSON.stringify(gameName)}`);
    reply = { type: "answer", id, answer: runStrategy(strategy, state, botID, setupData) };
  } catch (error) {
    reply = { type: "threw", id, message: error instanceof Error ? error.message : String(error) };
  }
  port.postMessage(reply);
});

const ready: WorkerMessage = { type: "ready" };
port.postMessage(ready);
