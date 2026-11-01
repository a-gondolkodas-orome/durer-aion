// The supply-chain cooldown, as the two dependency scripts see it. `.npmrc` sets `min-release-age`,
// so npm resolves nothing published more recently than that — docs/DEPENDENCIES.md says why. A
// script proposing a younger version would only send the maintainer into an `npm install` that
// fails, so both read the same number from the same file and propose what npm will install.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const DAY = 24 * 60 * 60 * 1000;

// 0 when `.npmrc` sets none, which turns every check below into a no-op rather than an error.
export const parseMinReleaseAge = npmrc => Number(npmrc.match(/^[ \t]*min-release-age[ \t]*=[ \t]*(\d+)/m)?.[1] ?? 0);

export const minReleaseAge = () => parseMinReleaseAge(readFileSync(`${repoRoot}.npmrc`, 'utf8'));

const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;

// Numeric over the three parts; only meaningful for exact stable versions, the only kind pinned here.
export const compareStable = (a, b) => {
  const [aParts, bParts] = [a, b].map(version => version.split('.').map(Number));
  return aParts[0] - bParts[0] || aParts[1] - bParts[1] || aParts[2] - bParts[2];
};

// The versions old enough to install, from a full packument's `time` map — which also carries
// `created` and `modified`, neither of them a version.
export const matureVersions = (time, days, now) => Object.entries(time)
  .filter(([version, published]) => STABLE.test(version) && Date.parse(published) <= now - days * DAY)
  .map(([version]) => version);

// What `latest` means under the cooldown: the dist-tag when it is old enough, otherwise the newest
// stable version below it that is. Never below `current`, so a pin taken deliberately inside the
// window (DEPENDENCIES.md says when) does not read as behind its own predecessor. Answers
// `{ latest, cooling }`, where `cooling` is the dist-tag held back, if one was.
export const newestMature = ({ current, distLatest, mature }) => {
  if (mature.includes(distLatest)) return { latest: distLatest };
  const below = mature.filter(version => compareStable(version, distLatest) < 0).sort(compareStable).at(-1);
  const latest = below === undefined || (STABLE.test(current) && compareStable(below, current) < 0) ? current : below;
  return { latest, cooling: distLatest };
};

const registry = async (name, abbreviated) => {
  const response = await fetch(`https://registry.npmjs.org/${name}`,
    abbreviated ? { headers: { accept: 'application/vnd.npm.install-v1+json' } } : {});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// A full packument runs to tens of megabytes once parsed (vite's is ~40), so only a few at a time.
let slots = 4;
const waiting = [];
const limited = async task => {
  if (slots === 0) await new Promise(resolve => waiting.push(resolve));
  else slots--;
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) next(); else slots++;
  }
};

// Every version of `name`, the `latest` dist-tag, and the versions old enough to install. Only the
// abbreviated packument is fetched when its `modified` is outside the window — nothing in it can be
// too new then — and the full one, the only one carrying publish times, only when it is not.
export const releases = async (name, days = minReleaseAge(), now = Date.now()) => {
  const abbreviated = await registry(name, true);
  const versions = Object.keys(abbreviated.versions);
  const distLatest = abbreviated['dist-tags'].latest;
  if (days === 0 || Date.parse(abbreviated.modified) <= now - days * DAY) {
    return { versions, distLatest, mature: versions };
  }
  const { time } = await limited(() => registry(name, false));
  return { versions, distLatest, mature: matureVersions(time, days, now) };
};
