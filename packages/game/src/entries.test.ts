import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

// A specifier a bundler resolves but this walk cannot read — `import(name)`, a
// template literal — is a hole like any other, so it stops the run.
const moduleName = (node: ts.Node | undefined, file: string): string => {
  if (node === undefined || !ts.isStringLiteral(node)) {
    throw new Error(`${file} has an import whose specifier this walk cannot read`);
  }
  return node.text;
};

// Every edge a bundler would follow out of one file: both forms a barrel uses,
// `import … from` and `export … from`, the bare `import './x'` that pulls a module
// in for its side effects, and `import()`, which splits a chunk out rather than
// dropping it. Type-only declarations are erased before any bundle sees them, so
// they cannot drag code in; an inline `type` specifier does not make its statement
// type-only, and counting the statement is the safe way round.
//
// Read from TypeScript's own parse, not a regex. A regex has to shape-match a
// statement, and the shapes it did not match it dropped in silence — an indented
// import, a member list carrying a comment with an apostrophe, a second statement
// on one line, `import()` in any position — which is the one failure this walk must
// not have: an edge lost here is a hole in every check below. The last two tests
// pin the shapes.
const specifierOf = (node: ts.Node, file: string): string | undefined => {
  // `phaseModifier`, not the deprecated `isTypeOnly`: the modifier is `defer` as
  // well as `type` now, and a deferred import is an edge — the module is loaded,
  // just later.
  if (ts.isImportDeclaration(node) && node.importClause?.phaseModifier !== ts.SyntaxKind.TypeKeyword) {
    return moduleName(node.moduleSpecifier, file);
  }
  if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier !== undefined) {
    return moduleName(node.moduleSpecifier, file);
  }
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    return moduleName(node.arguments[0], file);
  }
  return undefined;
};

const relativeImports = (file: string): string[] => {
  const parsed = ts.createSourceFile(
    file,
    sources.get(file) ?? "",
    ts.ScriptTarget.Latest,
    false,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    const specifier = specifierOf(node, file);
    if (specifier?.startsWith(".") === true) found.push(specifier);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(parsed, visit);
  return found;
};

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

  // One statement per shape a regex walk got wrong, each of which dropped its edge
  // in silence and with it every check above. In order: a semicolon-free type-only
  // import, which used to run on to the `from './…'` on the line below and then be
  // discarded as type-only, taking the board's import of its bot with it; a member
  // list whose comment carries an apostrophe, which ended the match early; an
  // indented statement; a second statement on the same line; and `import()`, which a
  // bundler answers with a lazy chunk — a board's bot served on the first click
  // rather than never.
  it("reads every import shape an edge can hide in", () => {
    sources.set("probe.tsx", [
      "import type { State } from 'boardgame.io'",
      "import { strategyWrapper } from './strategy'",
      "import {",
      "  moveMap, // don't drop this one",
      "} from './moveMap';",
      "  import { table } from './indented';",
      "import { a } from './a'; import { b } from './b';",
      "const lazy = () => import('./lazy');",
      "import 'lodash'",
      "import './side'",
      "export * from './reexported';",
      "export type { Move } from './erased';",
      "import { type Category, wrapper } from './inline-type';",
    ].join("\n"));
    try {
      expect(relativeImports("probe.tsx")).toEqual([
        "./strategy", "./moveMap", "./indented", "./a", "./b",
        "./lazy", "./side", "./reexported", "./inline-type",
      ]);
    } finally {
      sources.delete("probe.tsx");
    }
  });

  it("stops on a specifier it cannot read", () => {
    sources.set("probe.ts", "const name = './strategy';\nconst lazy = () => import(name);");
    try {
      expect(() => relativeImports("probe.ts")).toThrow(/cannot read/);
    } finally {
      sources.delete("probe.ts");
    }
  });
});
