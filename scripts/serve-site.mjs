#!/usr/bin/env node
// Serves ./site, the artifact `npm run site:build` assembles, so the Pages deploy can be looked
// at before it is published. Deliberately dependency-free and about as dumb as GitHub Pages:
// static files, directory index, 404 for anything missing. It is not a dev server — nothing
// here reloads, and rebuilding means running `npm run site:build` again.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  // Strip the query and normalise, then re-resolve under root: without the prefix check a
  // request for /../../etc/passwd would escape the served directory.
  const requested = decodeURIComponent(req.url.split('?')[0]);
  let path = resolve(root, '.' + normalize(requested));
  if (path !== root && !path.startsWith(root + '/')) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
  } catch {
    res.writeHead(404).end(`Not found: ${requested}`);
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end(`Not found: ${requested}`);
  }
}).listen(port, () => {
  console.log(`site/ on http://localhost:${port}/`);
  console.log('  /              home');
  console.log('  /jatekok/      strategy practice');
  console.log('  /proba-verseny/ competition dry run');
  console.log('  /valto/        the frozen 2023 relay build');
});
