// Two halves share this package: the core (export '.'), which a bare node
// competition server imports, and the React client half in react/ (export
// './react'). ESLint bans React in the core by specifier, but a specifier does
// not say what it resolves to — './something' reaching a .tsx, or anything
// under react/, is invisible to it. This walk pins the boundary the package
// exists for: everything reachable from the core entry stays framework-free.
// The assertion is not redundant, whatever the rule says: `tsc` types this glob
// as Record<string, unknown> and fails without it. ESLint's own program resolves
// vite/client's overload differently, so the two disagree about this one line.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const sources = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as
  Record<string, string>;

// './a/b' + '../c' -> './a/c'
const resolvePath = (fromFile: string, specifier: string): string | null => {
  const segments = fromFile.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') segments.pop();
    else if (part !== '.') segments.push(part);
  }
  const base = segments.join('/');
  return [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    .find(candidate => candidate in sources) ?? null;
};

// Both forms an entry barrel uses: `import … from` and `export … from`.
const relativeImports = (file: string): string[] =>
  [...sources[file].matchAll(/^(?:import|export)\s[^;]*?from\s*['"](\.[^'"]+)['"];/gms)]
    // Type-only edges are erased before any host sees them, so they cannot drag React in.
    .filter(([statement]) => !statement.startsWith('import type') && !statement.startsWith('export type'))
    .map(match => match[1]);

// Every module reachable from `entry` through relative value imports, entry included.
const reachableFrom = (entry: string): string[] => {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length > 0) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of relativeImports(file)) {
      const target = resolvePath(file, specifier);
      if (target !== null && !seen.has(target)) stack.push(target);
    }
  }
  return [...seen];
};

describe('the core entry stays React-free', () => {
  const reached = reachableFrom('./index.ts');

  it('walks a graph, not an empty set', () => {
    expect(reached.length).toBeGreaterThan(5);
  });

  it('reaches nothing under react/ and no .tsx', () => {
    expect(reached.filter(file => file.startsWith('./react/') || file.endsWith('.tsx'))).toEqual([]);
  });

  it("names no 'react' module as a value import anywhere it reaches", () => {
    const offenders = reached.filter(file =>
      /^import\s(?!type\s)[^;]*?from\s*['"]react[^'"]*['"];/ms.test(sources[file]));
    expect(offenders).toEqual([]);
  });
});
