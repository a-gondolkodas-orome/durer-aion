// Regenerates hungarian-hunspell-words.txt and triages new Hungarian words.
//
// cspell cannot consult hunspell at runtime and @cspell/dict-hu-hu is a
// shallow affix expansion (a full expansion of hu_HU runs out of memory), so
// the everyday agglutinated forms it misses have to be listed somewhere. This
// script keeps that list out of human hands: it collects every word cspell
// would flag without the two project dictionaries, asks hunspell hu_HU which
// of them are correct Hungarian, and rewrites hungarian-hunspell-words.txt
// with the accepted ones. Whatever hunspell rejects is printed for a human:
// each is either a real typo to fix, or belongs in hungarian-words.txt (the
// small hand-curated file of coinages and proper nouns).
//
// Usage: npm run spell-check:hu-triage
// Needs the hunspell binary and its Hungarian dictionary:
//   sudo apt install hunspell hunspell-hu
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const generatedFile = join(root, "hungarian-hunspell-words.txt");
const handFile = join(root, "hungarian-words.txt");

const hunspellCheck = spawnSync("hunspell", ["-v"], { encoding: "utf-8" });
if (hunspellCheck.error) {
  console.error("hunspell not found - install it with: sudo apt install hunspell hunspell-hu");
  process.exit(1);
}

// The same globs the spell-check script checks, read from package.json so the
// two cannot drift apart.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const globs = [...pkg.scripts["spell-check"].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// A config identical to the repo's, minus the two project dictionaries, so
// cspell reports every word they currently absorb.
const config = JSON.parse(readFileSync(join(root, "cspell.json"), "utf-8"));
config.dictionaries = config.dictionaries.filter(
  (d) => d !== "hu-extra" && d !== "hu-hunspell",
);
// The temp config must live inside the repo: cspell resolves the
// @cspell/dict-hu-hu import against node_modules relative to the config file.
mkdirSync(join(root, "node_modules/.cache"), { recursive: true });
const tmp = mkdtempSync(join(root, "node_modules/.cache/hu-triage-"));
const tmpConfig = join(tmp, "cspell.json");
// dictionaryDefinitions paths are relative to the config file, so anchor them.
config.dictionaryDefinitions = (config.dictionaryDefinitions ?? []).map((d) => ({
  ...d,
  path: join(root, d.path),
}));
config.globRoot = root;
writeFileSync(tmpConfig, JSON.stringify(config));

let flagged;
try {
  // cspell exits 1 when it finds words - that is the expected case here.
  const res = spawnSync(
    join(root, "node_modules/.bin/cspell"),
    // --no-config-search: without it cspell finds and merges the repo's own
    // cspell.json per checked file, re-enabling the dictionaries just disabled.
    [...globs, "--config", tmpConfig, "--no-config-search", "--words-only", "--unique", "--no-progress"],
    { encoding: "utf-8", cwd: root, maxBuffer: 64 * 1024 * 1024 },
  );
  if (res.status !== 0 && res.status !== 1) {
    console.error("cspell failed:\n" + res.stderr);
    process.exit(1);
  }
  flagged = [...new Set(res.stdout.split("\n").filter((w) => w.trim() !== ""))];
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (flagged.length === 0) {
  // With both project dictionaries disabled, all their words must reappear;
  // an empty run means the collection step broke, not that the list is empty.
  console.error("cspell reported no words at all - refusing to empty the word list.");
  process.exit(1);
}

const rejected = new Set(
  execFileSync("hunspell", ["-i", "UTF-8", "-d", "hu_HU", "-l"], {
    input: flagged.join("\n"),
    encoding: "utf-8",
  })
    .split("\n")
    .filter((w) => w.trim() !== ""),
);

const readWords = (file) =>
  readFileSync(file, "utf-8")
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.startsWith("#"));
// Case-insensitive: a lowercase hand-file entry covers its capitalized uses.
const handWords = new Set(readWords(handFile).map((w) => w.toLowerCase()));
const inHandFile = (w) => handWords.has(w.toLowerCase());

// A lowercase dictionary entry already matches Title-case and ALL-CAPS uses,
// so a capitalized form whose lowercase twin is also accepted is redundant.
const acceptedSet = new Set(flagged.filter((w) => !rejected.has(w) && !inHandFile(w)));
const accepted = [...acceptedSet]
  .filter((w) => w === w.toLowerCase() || !acceptedSet.has(w.toLowerCase()))
  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "hu"));

const header = readFileSync(generatedFile, "utf-8")
  .split("\n")
  .filter((l) => l.startsWith("#"));
writeFileSync(generatedFile, [...header, ...accepted, ""].join("\n"));
console.log(`hungarian-hunspell-words.txt: ${accepted.length} words (hunspell-approved)`);

const needsHuman = [...rejected].filter((w) => !inHandFile(w)).sort();
if (needsHuman.length > 0) {
  console.log("\nhunspell does not know these - fix the typo, or add to hungarian-words.txt:");
  for (const w of needsHuman) console.log("  " + w);
  process.exit(1);
}
