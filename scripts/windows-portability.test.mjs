// Contributors develop on Windows, and the two ways this repo breaks there both look like
// ordinary code until someone runs it: npm and npx are `.cmd` files node cannot exec without a
// shell (#483), and a `FOO=bar cmd` prefix is shell syntax cmd.exe does not have. Neither is
// caught by lint, by CI — which is ubuntu — or by review, so it is caught here.
//
// This walks the tree rather than listing files, so a script added later is covered the day it
// lands.
import { readFileSync, readdirSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', 'build', 'reports', 'coverage', '.git']);

function* filesIn(dir, matches) {
  for (const entry of readdirSync(`${repoRoot}${dir}`, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = posix.join(dir, entry.name);

    if (entry.isDirectory()) yield* filesIn(path, matches);
    else if (matches(entry.name)) yield path;
  }
}

const read = path => readFileSync(`${repoRoot}${path}`, 'utf8');
const list = entries => entries.map(entry => `  ${entry}`).join('\n');

describe('a script node runs itself', () => {
  // Checked per file rather than per call site: the command is often a variable by the time it
  // reaches the spawn — scripts/assemble-site.mjs passes it through a `run()` helper — and a
  // file that runs npm at all has to have decided about the shell somewhere in it.
  it('gives npm and npx a shell, which is the only way to exec a .cmd', () => {
    const offenders = [...filesIn('scripts', name => name.endsWith('.mjs'))]
      .filter(path => !path.endsWith('.test.mjs'))
      .filter(path => /(['"])np[mx]\1/.test(read(path)))
      // The option key where an option can be, not the word: prose about a shell is not a
      // decision about one, and `without a shell: the spawn fails` is prose.
      .filter(path => !/^\s*shell\s*:/m.test(read(path)));

    expect(
      offenders,
      'These run npm or npx without deciding about `shell`, so the spawn fails outright on '
      + `Windows:\n${list(offenders)}\nPass \`shell: process.platform === 'win32'\`, or run the `
      + "tool's bin with `process.execPath` and skip npx altogether."
    ).toStrictEqual([]);
  });
});

describe('an npm script', () => {
  const manifests = [
    'package.json',
    ...filesIn('apps', name => name === 'package.json'),
    ...filesIn('packages', name => name === 'package.json'),
  ];

  const commands = manifests.flatMap(path =>
    Object.entries(JSON.parse(read(path)).scripts ?? {}).map(([name, command]) => ({
      where: `${path} → ${name}`,
      command,
    }))
  );

  it('has scripts to check at all, so a broken walk cannot pass by finding nothing', () => {
    expect(commands.length).toBeGreaterThan(20);
  });

  it('sets no environment variable the way only a POSIX shell understands', () => {
    // `FOO=bar cmd` is not syntax on cmd.exe, which reads it as the name of a program to run.
    // cross-env is a dependency here for exactly this, and turbo passes declared vars through.
    const offenders = commands
      .filter(({ command }) =>
        command.split('&&').some(part => /^\s*[A-Za-z_][A-Za-z0-9_]*=/.test(part))
      )
      .map(({ where, command }) => `${where}: ${command}`);

    expect(
      offenders,
      `These prefix a command with an environment variable, which cmd.exe cannot do:\n${
        list(offenders)}\nUse cross-env, or set it in the script the command runs.`
    ).toStrictEqual([]);
  });

  it('quotes with double quotes, the only kind cmd.exe reads', () => {
    // cmd.exe has no single-quote syntax at all: it passes them through as part of the argument,
    // so a glob quoted that way arrives with the quotes still on it.
    const offenders = commands
      .filter(({ command }) => command.includes("'"))
      .map(({ where, command }) => `${where}: ${command}`);

    expect(
      offenders,
      `These use single quotes, which cmd.exe passes through as characters:\n${list(offenders)}`
    ).toStrictEqual([]);
  });
});
