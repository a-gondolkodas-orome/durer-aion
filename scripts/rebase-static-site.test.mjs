import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLeftovers, rebase } from './rebase-static-site.mjs';

let dir;
const src = () => join(dir, 'src');
const dest = () => join(dir, 'dest');
const write = (path, text) => {
  mkdirSync(join(src(), path, '..'), { recursive: true });
  writeFileSync(join(src(), path), text);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rebase-'));
  mkdirSync(src(), { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('findLeftovers', () => {
  // The case the whole check turns on: a site moving deeper into its own path means every
  // rewritten occurrence still contains the old prefix, so a naive search always "finds" one.
  it('does not count a rewritten prefix as a leftover', () => {
    expect(findLeftovers('src="/durer-aion/valto/main.js"', '/durer-aion/', '/durer-aion/valto/')).toBe(0);
  });

  it('counts one that was genuinely missed', () => {
    expect(findLeftovers('src="/durer-aion/valto/a.js" href="/durer-aion/b.css"', '/durer-aion/', '/durer-aion/valto/')).toBe(1);
  });
});

describe('rebase', () => {
  it('rewrites every occurrence in the file types a build bakes a base into', () => {
    write('index.html', '<script src="/durer-aion/main.js"></script><link href="/durer-aion/main.css">');
    write('asset-manifest.json', '{"main.js":"/durer-aion/main.js"}');
    write('static/main.js', 'n.p="/durer-aion/"');

    const rewritten = rebase(src(), dest(), { from: '/durer-aion/', to: '/valto/' });

    expect(readFileSync(join(dest(), 'index.html'), 'utf8'))
      .toBe('<script src="/valto/main.js"></script><link href="/valto/main.css">');
    expect(readFileSync(join(dest(), 'static/main.js'), 'utf8')).toBe('n.p="/valto/"');
    expect(rewritten.find(file => file.path === 'index.html').count).toBe(2);
  });

  // An extension REWRITABLE does not list is copied through untouched, whatever it contains.
  it('copies files it does not rewrite', () => {
    write('index.html', '/durer-aion/');
    write('favicon.ico', 'icon bytes');

    rebase(src(), dest(), { from: '/durer-aion/', to: '/valto/' });

    expect(readFileSync(join(dest(), 'favicon.ico'), 'utf8')).toBe('icon bytes');
  });

  // A copy that rewrote nothing looks exactly like a successful one, and only fails later as a
  // deployed site that 404s every asset.
  it('refuses a source that does not contain the prefix at all', () => {
    write('index.html', '<script src="/main.js"></script>');

    expect(() => rebase(src(), dest(), { from: '/durer-aion/', to: '/valto/' }))
      .toThrow(/Nothing to rebase/);
  });

  it('fails when a file type it does not rewrite still carries the prefix', () => {
    write('index.html', '/durer-aion/');
    // .xml is not in REWRITABLE, so it is copied untouched — and then caught by the scan.
    write('sitemap.xml', '<loc>/durer-aion/</loc>');

    expect(() => rebase(src(), dest(), { from: '/durer-aion/', to: '/valto/' }))
      .toThrow(/sitemap\.xml: 1/);
  });
});
