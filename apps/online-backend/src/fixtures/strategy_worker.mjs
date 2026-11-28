// A stand-in for bot_worker.js, which the suites cannot load: a worker runs a
// built file, and they run TypeScript source. It speaks the same protocol
// (bot_pool.ts), and `workerData.mode` picks what it does with a call:
//
// - "echo": answers `[[G.n], "echo"]`, or does what `G` says first: busy-waits
//   `G.sleepMs`, loops for ever on `G.loop`, throws on `G.throw`, and takes
//   its thread down on `G.crash`. For bot_pool.test.ts.
// - "ketkupac": plays minta-ketkupac's play phase the plainest legal way, one
//   token from the first pile that has one, after busy-waiting the match's
//   `setupData.sleepMs` before choosing the pile — or loops for ever on its
//   `setupData.loop`. For socketio_transport.test.ts, whose matches each set
//   their own.
import { setImmediate } from "node:timers";
import { parentPort, workerData } from "node:worker_threads";

const busyWait = (ms) => {
  const until = Date.now() + ms;
  while (Date.now() < until) { /* the slow corner of a search */ }
};
const forever = () => {
  for (;;) { /* a search that never ends */ }
};

function echo({ G }) {
  if (G.loop) forever();
  if (G.sleepMs) busyWait(G.sleepMs);
  if (G.throw) throw new Error(G.throw);
  if (G.crash) {
    // Outside the call's try, so nothing catches it; and no answer.
    setImmediate(() => { throw new Error("the worker fell over"); });
    return undefined;
  }
  return [[G.n], "echo"];
}

function ketkupac({ G }, setupData) {
  if (setupData?.loop) forever();
  if (G.selectedPile === null) {
    busyWait(setupData?.sleepMs ?? 0);
    return [[G.piles.findIndex(size => size > 0)], "selectPile"];
  }
  return [[G.selectedPile, 1], "take"];
}

const strategy = { echo, ketkupac }[workerData.mode];

parentPort.on("message", ({ id, state, setupData }) => {
  const started = Date.now();
  try {
    const move = strategy(state, setupData);
    if (move === undefined) return;
    parentPort.postMessage({ type: "answer", id, answer: { move, strategyMs: Date.now() - started } });
  } catch (error) {
    parentPort.postMessage({ type: "threw", id, message: error.message });
  }
});
parentPort.postMessage({ type: "ready" });
