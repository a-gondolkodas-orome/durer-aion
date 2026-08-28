import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { botOnlyFiles, checkGames, extractMarkers, localImports, verdict } from './check-botless-bundle.mjs';

let dir;
const games = () => join(dir, 'games');
const dist = () => join(dir, 'dist');
const write = (path, text) => {
  mkdirSync(join(dir, path, '..'), { recursive: true });
  writeFileSync(join(dir, path), text);
};

// A minimal game folder in the live layout: board and description import the game, the
// strategy imports the game and its own lookup table.
const writeGame = (name, { tableKey = 'secret-table-entry-1' } = {}) => {
  write(`games/${name}/game.ts`, `export const moves = { take: 'takeStone' };`);
  write(`games/${name}/board.tsx`, `import { moves } from './game';`);
  write(`games/${name}/main.tsx`, `export const description = 'a fine game';`);
  write(`games/${name}/strategy.ts`, `import { moves } from './game';\nimport { table } from './table';`);
  write(`games/${name}/table.ts`, `export const table = { '${tableKey}': true, 'takeStone': 1 };`);
  write(`games/${name}/index.ts`, `export * from './game'\nexport * from './strategy'`);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'botless-'));
  mkdirSync(dist(), { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('localImports', () => {
  it('finds relative specifiers and skips package imports', () => {
    expect(localImports(`import { a } from './x';\nimport { b } from 'boardgame.io';\nimport c from '../common';`))
      .toEqual(['./x', '../common']);
  });
});

describe('botOnlyFiles', () => {
  it('keeps the strategy and its table, not the game the strategy also imports', () => {
    writeGame('stones');
    const files = botOnlyFiles(join(games(), 'stones')).map(file => file.split('/').pop());
    expect(files.sort()).toEqual(['strategy.ts', 'table.ts']);
  });
});

describe('extractMarkers', () => {
  it('drops short and path-like literals and prefers the longest', () => {
    expect(extractMarkers(`a('0'); b('./x'); c('9-1.[true, true]'); d("6_28");`))
      .toEqual(['9-1.[true, true]', '6_28']);
  });
});

describe('verdict', () => {
  // One marker in the bundle can be four characters of minified coincidence; a shipped bot
  // brings all its literals, so only a majority convicts.
  it('does not convict on a lone coincidental hit', () => {
    expect(verdict(['aaaa', 'bbbb', 'cccc', 'dddd'], 'xx aaaa xx').shipped).toBe(false);
    expect(verdict(['aaaa', 'bbbb', 'cccc', 'dddd'], 'aaaa bbbb cccc').shipped).toBe(true);
  });
});

describe('checkGames', () => {
  it('passes on a clean bundle', () => {
    writeGame('stones');
    write('dist/assets/index-abc.js', `console.log('takeStone')`);
    expect(checkGames(games(), dist())).toEqual([]);
  });

  it('fails when the bot table leaks into the bundle', () => {
    writeGame('stones');
    write('dist/assets/index-abc.js', `const t={'secret-table-entry-1':true};`);
    const failures = checkGames(games(), dist());
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('stones');
  });

  // A literal the shipped files also contain is legitimately in the bundle; it must neither
  // convict ('takeStone' is in game.ts too) nor count toward the marker total.
  it('ignores literals shared with shipped files', () => {
    writeGame('stones');
    write('dist/assets/index-abc.js', `send('takeStone')`);
    expect(checkGames(games(), dist())).toEqual([]);
  });

  it('fails a game whose bot has no distinctive literal to latch onto', () => {
    writeGame('blind', { tableKey: 'x' });
    write('dist/assets/index-abc.js', ``);
    const failures = checkGames(games(), dist());
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('no distinctive string literal');
  });
});
