// Every game's gameplay.ts has to run in plain Node: it is the module a
// server-authoritative competition mode would validate moves with (see
// issue #313). ESLint bans `react` and the factory barrel by
// specifier, but it cannot tell that a specifier like './pebble-pile' resolves
// to a .tsx — that is what this walk is for, and it follows the .ts files it
// finds so an indirect pull is caught too.
const sources = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as
  Record<string, string>;

const gameplayModules = Object.keys(sources).filter(path => path.endsWith('/gameplay.ts'));

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

const relativeImports = (file: string): string[] =>
  [...sources[file].matchAll(/^import\s[^;]*?from\s*['"](\.[^'"]+)['"];/gms)].map(match => match[1]);

// Every module reachable from `entry` through relative imports, entry included.
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

describe('gameplay modules stay React-free', () => {
  it('finds the gameplay modules to check', () => {
    expect(gameplayModules.length).toBeGreaterThan(5);
  });

  it.each(gameplayModules)('%s reaches no React module', file => {
    expect(reachableFrom(file).filter(reached => reached.endsWith('.tsx'))).toEqual([]);
  });
});
