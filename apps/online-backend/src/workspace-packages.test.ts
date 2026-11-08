import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The server bundles these packages from source (tsdown.config.mts) and so
// does its typecheck (tsconfig.json `paths`), but the live frontend resolves
// them like Node does — Vite, with no alias — through each package's exports
// map. So the map is the contract: every target lands in the build, never
// in the source, and every entry the server reads from source (`game`,
// `game/bot`) is a file the map names, so the two views of a package cannot
// drift apart.
const packages = ["game", "problem-bank", "relay-bot", "schemas"] as const;

function packageDir(name: string) {
  return join(__dirname, "..", "..", "..", "packages", name);
}

function manifestOf(name: string) {
  return JSON.parse(readFileSync(join(packageDir(name), "package.json"), "utf8")) as {
    exports?: Record<string, unknown>;
  };
}

function leaves(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (node !== null && typeof node === "object") return Object.values(node).flatMap(leaves);
  return [];
}

describe.each(packages)("the %s package", (name) => {
  const exports = manifestOf(name).exports;

  it("is reachable only through its build", () => {
    expect(exports, "no exports map: node falls back to the package source").toBeDefined();

    // Every path the map can resolve to, whatever conditions it nests them under
    // — the leaves, not the subpath keys, which also start with "./".
    const targets = leaves(exports);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target).toMatch(/^\.\/dist\//);
    }
  });

  it("has a source entry for every subpath it exports", () => {
    for (const subpath of Object.keys(exports ?? {})) {
      // A pattern, such as problem-bank's "./banks/*", is a folder of entries.
      if (subpath.endsWith("/*")) {
        const folder = join(packageDir(name), subpath.slice(2, -2));
        expect(existsSync(folder) && readdirSync(folder).some(file => file.endsWith(".ts")), `${name}/${subpath.slice(2)} for export "${subpath}"`).toBe(true);
        continue;
      }
      // "." is index.ts; "./bot" is bot.ts — the file tsdown builds the subpath from.
      const entry = subpath === "." ? "index.ts" : `${subpath.slice(2)}.ts`;
      expect(existsSync(join(packageDir(name), entry)), `${name}/${entry} for export "${subpath}"`).toBe(true);
    }
  });
});
