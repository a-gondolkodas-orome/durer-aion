import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// The team import was a mode of the server until #190 — `server.js import
// <tsv>` — so loading a TSV first had to satisfy the bot password, the admin
// password and the competition window, none of which it reads, and any
// load-time failure anywhere in the server stopped it. It is its own entry
// now; this walk is what keeps it one. A specifier is not the whole story —
// an innocent-looking helper that re-exports the server's env checks, or the
// game registry behind them, would put them back — so this follows the edges
// rather than reading the entry's own import list.
const src = __dirname;

const forbidden = [
  // The server's own module body: its env checks and everything they guard.
  "server.ts",
  // The env getters the import does not need. `getDb` reads DATABASE_URL,
  // which it does, and lives in server/db.ts.
  "server/common.ts",
];

// The packages the import has no business loading: the games and their bots,
// the framework serving them, the socket transport, and the error reporter.
const forbiddenPackages = ["game", "game/bot", "relay-bot", "boardgame.io", "socket.io", "@sentry/node"];

// 'server/db.ts' + './model' -> 'server/model.ts'. A specifier this cannot
// place must fail loudly: an edge dropped here is a hole in the check.
const resolvePath = (fromFile: string, specifier: string): string => {
  const segments = fromFile.split("/").slice(0, -1);
  for (const part of specifier.split("/")) {
    if (part === "..") segments.pop();
    else if (part !== ".") segments.push(part);
  }
  const base = segments.join("/");
  const target = [`${base}.ts`, `${base}/index.ts`].find(candidate => {
    try {
      readFileSync(join(src, candidate), "utf8");
      return true;
    } catch {
      return false;
    }
  });
  if (target === undefined) throw new Error(`${fromFile} imports '${specifier}', which this walk cannot resolve`);
  return target;
};

const moduleName = (node: ts.Node | undefined, file: string): string => {
  if (node === undefined || !ts.isStringLiteral(node)) {
    throw new Error(`${file} has an import whose specifier this walk cannot read`);
  }
  return node.text;
};

// Every edge a bundler would follow out of one file: both forms a barrel uses,
// the bare `import './x'` pulled in for its side effects, and `import()`, which
// splits a chunk out rather than dropping it. Read from TypeScript's own parse
// rather than a regex, for the reason packages/game/src/entries.test.ts gives
// at length: a shape it fails to match, it drops in silence.
const specifiersOf = (file: string): string[] => {
  const source = ts.createSourceFile(file, readFileSync(join(src, file), "utf8"), ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    // A type-only declaration is erased before any bundle sees it, so it drags
    // nothing in. `phaseModifier`, not the deprecated `isTypeOnly`: the modifier
    // is `defer` as well as `type` now, and a deferred import is still an edge.
    if (ts.isImportDeclaration(node) && node.importClause?.phaseModifier !== ts.SyntaxKind.TypeKeyword) {
      found.push(moduleName(node.moduleSpecifier, file));
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier !== undefined) {
      found.push(moduleName(node.moduleSpecifier, file));
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      found.push(moduleName(node.arguments[0], file));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

// Every file and every package the entry reaches, transitively.
const reach = (entry: string) => {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (files.has(file)) continue;
    files.add(file);
    for (const specifier of specifiersOf(file)) {
      if (specifier.startsWith(".")) queue.push(resolvePath(file, specifier));
      else packages.add(specifier);
    }
  }
  return { files, packages };
};

describe("the team import entry", () => {
  const { files, packages } = reach("import_teams.ts");

  it("does not reach the server", () => {
    // Sanity: a walk that resolved nothing would pass every check below.
    expect(files).toContain("server/team_import.ts");

    for (const module of forbidden) {
      expect([...files], `import_teams.ts reaches ${module}`).not.toContain(module);
    }
  });

  it("does not load the games, the bots or the game server", () => {
    for (const name of forbiddenPackages) {
      expect([...packages], `import_teams.ts loads ${name}`).not.toContain(name);
    }
    // `boardgame.io/server` and the like, which the list above names bare.
    for (const name of [...packages]) {
      expect(forbiddenPackages.some(banned => name.startsWith(`${banned}/`)), `import_teams.ts loads ${name}`).toBe(false);
    }
  });
});
