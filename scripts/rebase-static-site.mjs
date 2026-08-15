// Copies a built static site and rewrites the absolute base prefix baked into it, so an artifact
// built for one path can be served from another. Used by the Pages deploy to put the frozen 2023
// relay build (pages/valto-2023, built for /durer-aion/) under the site's /valto/ subpath — see
// docs/pages-consolidation.md.
//
// Only a build that cannot be rebuilt needs this. Anything with source builds against SITE_BASE
// instead, which is always the better answer.
import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// A build bakes its base into markup, manifests and the bundle's own chunk loader. Images and
// icons cannot contain it, and rewriting bytes inside them would only risk corrupting one.
const REWRITABLE = /\.(html|json|js|mjs|css|map|txt|webmanifest)$/;

const walk = dir =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

// `from` is a prefix of `to` whenever a site moves deeper into its own path (/durer-aion/ ->
// /durer-aion/valto/), so a leftover scan cannot simply look for `from` — every rewritten
// occurrence contains it. Removing the rewritten form first leaves only genuine leftovers.
export const findLeftovers = (text, from, to) => {
  const occurrences = text.split(to).join('').split(from).length - 1;
  return occurrences;
};

export const rebase = (srcDir, destDir, { from, to }) => {
  cpSync(srcDir, destDir, { recursive: true });

  const rewritten = [];
  for (const path of walk(destDir)) {
    if (!REWRITABLE.test(path)) continue;
    const text = readFileSync(path, 'utf8');
    const count = text.split(from).length - 1;
    if (count === 0) continue;
    writeFileSync(path, text.split(from).join(to));
    rewritten.push({ path: relative(destDir, path), count });
  }

  // A site that rebased nothing is a site that will 404 every asset once it is served from
  // somewhere else, and it looks exactly like a successful copy. Fail instead.
  if (rewritten.length === 0) {
    throw new Error(`Nothing to rebase: no file under ${srcDir} contains ${from}.`);
  }

  // The scan covers every file, including the ones REWRITABLE skipped — the point is to catch a
  // file type this script does not know about, not to re-check the ones it just wrote.
  const leftover = walk(destDir)
    .filter(path => !/\.(png|jpe?g|gif|ico|woff2?|ttf|eot|svg)$/.test(path))
    .map(path => ({ path: relative(destDir, path), count: findLeftovers(readFileSync(path, 'utf8'), from, to) }))
    .filter(file => file.count > 0);
  if (leftover.length > 0) {
    throw new Error(
      `${from} still present after rebasing:\n` +
        leftover.map(file => `  ${file.path}: ${file.count}`).join('\n')
    );
  }

  return rewritten;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [srcDir, destDir, from, to] = process.argv.slice(2);
  if (!srcDir || !destDir || !from || !to) {
    console.error('usage: rebase-static-site.mjs <src-dir> <dest-dir> <from-prefix> <to-prefix>');
    process.exit(1);
  }
  const rewritten = rebase(srcDir, destDir, { from, to });
  console.log(`Rebased ${from} -> ${to} in ${rewritten.length} files:`);
  for (const file of rewritten) console.log(`  ${file.path}: ${file.count}`);
}
