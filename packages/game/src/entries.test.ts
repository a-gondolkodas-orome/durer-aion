import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Three entries share this package: `game` (the rules, which the server and
// every client need), `game/bot` (the bots and their lookup tables, which the
// live client must never ship) and `game/client` (the React boards, which the
// server never renders). ESLint bans `game/bot` in apps/online-frontend by
// specifier, but a specifier does not say what it resolves to — a board
// importing './strategy', or a registry importing a folder barrel that
// re-exports both, is invisible to it. This walk pins the boundaries the
// entries exist for.
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

// Both forms a barrel uses: `import … from` and `export … from`. Type-only
// edges are erased before any bundle sees them, so they cannot drag code in.
const relativeImports = (file: string): string[] =>
  [...(sources.get(file) ?? "").matchAll(/^(?:import|export)\s[^;]*?from\s*['"](\.[^'"]+)['"]/gm)]
    .filter(([statement]) => !statement.startsWith("import type") && !statement.startsWith("export type"))
    .map(match => match[1]);

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

// The bot files by name, for the positive checks: that an entry reaches what it
// should. The negative check — that the client reaches nothing of the bot's —
// does not go by name, since a table can be called anything (last test).
const isBot = (file: string) => /(^|\/)(strategy|strategydict|moveMap)\.ts$/.test(file);
const isBoard = (file: string) => file.endsWith(".tsx");

describe("the package's entries", () => {
  it("walk a graph, not an empty set", () => {
    expect(reachableFrom("index.ts").length).toBeGreaterThan(5);
  });

  it("the shared entry reaches no bot and no board", () => {
    const reached = reachableFrom("index.ts");
    expect(reached.filter(isBot)).toEqual([]);
    expect(reached.filter(isBoard)).toEqual([]);
  });

  it("the bot entry reaches every game's bot and no board", () => {
    const reached = reachableFrom("bot.ts");
    expect(reached.filter(isBot).length).toBeGreaterThan(0);
    expect(reached.filter(isBoard)).toEqual([]);
  });

  it("the client entry reaches every game's board and no bot", () => {
    const reached = reachableFrom("client.ts");
    expect(reached.filter(isBoard).length).toBeGreaterThan(0);
    expect(reached.filter(isBot)).toEqual([]);
  });

  // Whatever the bot and the client both reach must be rules, i.e. reached by
  // the shared entry too. This is the check that needs no list of bot file
  // names: a board importing a lookup table under any name is a file the bot
  // entry reaches, the client entry reaches, and the shared entry does not.
  it("the client and the bot share nothing but the rules", () => {
    const shared = new Set(reachableFrom("index.ts"));
    const bot = new Set(reachableFrom("bot.ts"));
    const both = reachableFrom("client.ts").filter(file => bot.has(file) && !shared.has(file));
    expect(both).toEqual([]);
  });
});
