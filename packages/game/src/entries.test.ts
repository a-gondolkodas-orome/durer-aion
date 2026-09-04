import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Three entries share this package: `game` (the rules, which the server and
// every client need), `game/bot` (the bots and their lookup tables, which the
// live client must never ship) and `game/client` (the React boards, which the
// server never renders). ESLint bans `game/bot` everywhere but the server and
// the offline dry run by specifier, but a specifier does not say what it
// resolves to — a board importing './strategy', or a registry importing a
// folder barrel that re-exports both, is invisible to it. This walk pins the
// boundaries the entries exist for.
const root = fileURLToPath(new URL("..", import.meta.url));

// Every .ts/.tsx under the package root, keyed by its path relative to it.
const sources = new Map<string, string>();
const collect = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "dist" || entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (/\.tsx?$/.test(entry.name)) sources.set(relative(root, path), readFileSync(path, "utf8"));
  }
};
collect(root);

// 'a/b.ts' + '../c' -> 'c.ts' (or c.tsx, c/index.ts, c/index.tsx — whichever
// exists). A specifier this cannot place — one with an extension, say — must
// fail loudly: an edge dropped here is a hole in every check below.
const resolvePath = (fromFile: string, specifier: string): string => {
  const segments = fromFile.split("/").slice(0, -1);
  for (const part of specifier.split("/")) {
    if (part === "..") segments.pop();
    else if (part !== ".") segments.push(part);
  }
  const base = segments.join("/");
  const target = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    .find(candidate => sources.has(candidate));
  if (target === undefined) throw new Error(`${fromFile} imports '${specifier}', which this walk cannot resolve`);
  return target;
};

// Both forms a barrel uses, `import … from` and `export … from`, and the bare
// `import './x'` that pulls a module in for its side effects — an edge like any
// other to a bundler. Type-only edges are erased before any bundle sees them,
// so they cannot drag code in. A statement ends at a semicolon or at a quoted
// specifier, whichever comes first: nothing quoted precedes `from` inside one
// statement, so stopping at a quote keeps a match from running into the next
// line when the previous one has no semicolon (the last test says why).
const relativeImports = (file: string): string[] =>
  [...(sources.get(file) ?? "").matchAll(/^(?:import\s*['"](\.[^'"]+)['"]|(?:import|export)\s[^;'"]*?from\s*['"](\.[^'"]+)['"])/gm)]
    .filter(([statement]) => !statement.startsWith("import type") && !statement.startsWith("export type"))
    .map(match => match[1] ?? match[2]);

// Every module reachable from `entry` through relative value imports, entry included.
const reachableFrom = (entry: string): string[] => {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length > 0) {
    const file = stack.pop();
    if (file === undefined || seen.has(file)) continue;
    seen.add(file);
    for (const specifier of relativeImports(file)) {
      const target = resolvePath(file, specifier);
      if (!seen.has(target)) stack.push(target);
    }
  }
  return [...seen];
};

// A game folder's game.ts holds its rules and src/common the wrapper around them:
// the only files a bot and a board may legitimately have in common, per the game
// layout in CLAUDE.md. Everything else the bot entry reaches is the bot's own — a
// strategy file, or a lookup table under whatever name (last checks).
const isRules = (file: string) => file.startsWith("src/common/") || /(^|\/)game\.ts$/.test(file);
const isBoard = (file: string) => file.endsWith(".tsx");

describe("the package's entries", () => {
  it("walk a graph, not an empty set", () => {
    expect(reachableFrom("index.ts").length).toBeGreaterThan(5);
  });

  it("the shared entry reaches no board", () => {
    expect(reachableFrom("index.ts").filter(isBoard)).toEqual([]);
  });

  it("the bot entry reaches every game's bot and no board", () => {
    const reached = reachableFrom("bot.ts");
    // Every game folder's strategy.ts, whether or not a registry names it.
    const bots = [...sources.keys()].filter(file => file.endsWith("/strategy.ts"));
    expect(bots.length).toBeGreaterThan(0);
    expect(reached).toEqual(expect.arrayContaining(bots));
    expect(reached.filter(isBoard)).toEqual([]);
  });

  it("the client entry reaches every game's board", () => {
    expect(reachableFrom("client.ts").filter(isBoard).length).toBeGreaterThan(0);
  });

  // The check that needs no list of bot file names. The live client ships what the
  // shared and the client entry reach between them, so anything the bot entry
  // reaches from there is a table or a strategy in the served bundle — whether a
  // board imported it, or the rules themselves did, which is the one way a table
  // can be shipped while each entry looks clean on its own.
  it("shares nothing but the rules with the entries the live client ships", () => {
    const shipped = new Set([...reachableFrom("index.ts"), ...reachableFrom("client.ts")]);
    const leaked = reachableFrom("bot.ts").filter(file => shipped.has(file) && !isRules(file));
    expect(leaked, "rules belong in src/common or a game's game.ts, a bot's own files in neither").toEqual([]);
  });

  // Without a semicolon, a type-only import from a package used to swallow the
  // relative import on the next line: the match started at `import type`, ran
  // on to the first `from './…'` it found, and the type filter then dropped
  // the whole thing — a board importing its bot under that line went unseen
  // by every check above. A bare `import 'pkg'` did the same to `import './x'`.
  it("reads a relative import that follows a semicolon-free bare one", () => {
    sources.set("probe.ts", [
      "import type { State } from 'boardgame.io'",
      "import { strategyWrapper } from './strategy'",
      "import 'lodash'",
      "import './side'",
    ].join("\n"));
    try {
      expect(relativeImports("probe.ts")).toEqual(["./strategy", "./side"]);
    } finally {
      sources.delete("probe.ts");
    }
  });
});
