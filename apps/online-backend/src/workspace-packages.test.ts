import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The server's bundle reads the workspace packages' source through tsdown's
// aliases, but its typecheck resolves them like Node does, without JSX, so it
// must never reach a package's TypeScript source — the games' boards alone
// would fail it. Node resolution only guarantees that while each package's
// exports map is the single way in: without one, a missing `dist` falls back
// to the package's source barrel and the typecheck dies pointing at the game
// package instead of at the build that never ran.
const packages = ["game", "strategy", "schemas"] as const;

function manifestOf(name: string) {
  const path = join(__dirname, "..", "..", "..", "packages", name, "package.json");
  return JSON.parse(readFileSync(path, "utf8")) as {
    exports?: Record<string, unknown>;
  };
}

describe.each(packages)("the %s package the server imports", (name) => {
  it("is reachable only through its build", () => {
    const exports = manifestOf(name).exports;
    expect(exports, "no exports map: node falls back to the package source").toBeDefined();

    // Every path the map can resolve to, whatever conditions it nests them under.
    const targets = JSON.stringify(exports).match(/"\.\/[^"]+"/g) ?? [];
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target).toMatch(/^"\.\/dist\//);
    }
  });
});
