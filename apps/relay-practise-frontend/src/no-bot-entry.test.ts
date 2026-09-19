import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// This app is exempt from the bot bans in eslint.config.mjs, because it serves past
// years' relay problems and so names `relay-bot` on purpose. The exemption is
// per-app rather than per-rule, so it also takes the app out of the `game/bot` ban
// — which it has no use for and should keep obeying. That is what this pins.
//
// Only the specifiers this app writes itself: what `game` and `game/client` reach
// in turn is packages/game/src/entries.test.ts's walk, and this app has no bot
// entry of its own to walk into.
const src = fileURLToPath(new URL(".", import.meta.url));

// The bot entry and every path spelling of packages/game, as eslint.config.mjs
// bans them for everyone else.
const forbidden = /^game\/bot$|(^|\/)packages\/game\/|(^|\/)game\/(bot($|\.)|src\/|dist\/)/;

const sources = new Map<string, string>();
const collect = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (/\.tsx?$/.test(entry.name)) sources.set(relative(src, path), readFileSync(path, "utf8"));
  }
};
collect(src);

// A specifier this walk cannot read is a hole in the check, so it stops the run
// rather than passing — the reasoning packages/game/src/entries.test.ts gives at
// length for reading TypeScript's own parse instead of a regex over the text.
const moduleName = (node: ts.Node | undefined, file: string): string => {
  if (node === undefined || !ts.isStringLiteral(node)) {
    throw new Error(`${file} has an import whose specifier this walk cannot read`);
  }
  return node.text;
};

// Every edge a bundler would follow: both forms a barrel uses, the bare
// side-effect import, and `import()`, which splits a chunk out rather than
// dropping it. A type-only declaration is erased before any bundle sees it.
const specifierOf = (node: ts.Node, file: string): string | undefined => {
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

const importsOf = (file: string): string[] => {
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
    if (specifier !== undefined) found.push(specifier);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(parsed, visit);
  return found;
};

describe("the relay practice site's exemption from the bot bans", () => {
  it("reads a source tree, not an empty set", () => {
    expect(sources.size).toBeGreaterThan(3);
  });

  it("names no bot entry", () => {
    const named = [...sources.keys()].flatMap(file =>
      importsOf(file).filter(specifier => forbidden.test(specifier)).map(specifier => `${file}: ${specifier}`));
    expect(named, "eslint.config.mjs exempts this app so it may import relay-bot, not a bot").toEqual([]);
  });

  it("still names relay-bot, which is why the exemption exists", () => {
    const named = [...sources.keys()].flatMap(file => importsOf(file).filter(specifier => specifier === "relay-bot"));
    expect(named.length, "no relay-bot import means the exemption, and this check, prove nothing").toBeGreaterThan(0);
  });

  it("catches a bot entry in every shape an import can take", () => {
    sources.set("probe.tsx", [
      "import { StrategyWrappers } from 'game/bot';",
      "import { table } from '../../packages/game/src/games/strategy/stones/strategy';",
      "const lazy = () => import('game/bot');",
      "export * from './local';",
    ].join("\n"));
    try {
      expect(importsOf("probe.tsx").filter(specifier => forbidden.test(specifier))).toEqual([
        "game/bot",
        "../../packages/game/src/games/strategy/stones/strategy",
        "game/bot",
      ]);
    } finally {
      sources.delete("probe.tsx");
    }
  });
});
