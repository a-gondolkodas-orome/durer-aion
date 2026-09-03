// Playwright and Node are each written down in several places — Node's are listed in the root
// README § Requirements, Playwright's in this app's README § Project setup — and a mismatch stays
// invisible until something fails far from the cause. Fail the test run instead.
//
// Files are compared against each other only — never against the running process.version, so a
// contributor on a slightly different local patch is not blocked.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvedVersion } from '../../../scripts/resolved-versions.mjs';

// Every path here is repository-relative: Node is the whole repository's pin, and GitHub only
// reads .github/workflows at the repository root anyway, so this app's workflows live there
// rather than beside the code they run. Only Playwright is this app's alone.
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');
const app = 'apps/strategy-practice/';

const errors = [];

// Reports a mismatch as a list of "where it is written down" -> "what it says".
const compare = (what, sources) => {
  const missing = sources.filter(([, version]) => !version);
  if (missing.length > 0) {
    errors.push(`Could not find the ${what} version in: ${missing.map(([where]) => where).join(', ')}.`);
    return;
  }
  const versions = new Set(sources.map(([, version]) => version));
  if (versions.size > 1) {
    const width = Math.max(...sources.map(([where]) => where.length));
    errors.push(
      `${what} version mismatch:\n` +
        sources.map(([where, version]) => `  ${where.padEnd(width)} ${version}`).join('\n') +
        `\nSet them all to the same version, then rebuild the devcontainer.`
    );
  }
};

const packageJson = JSON.parse(read(`${app}package.json`));

// The lockfile rather than package.json: the devcontainer bakes browsers for the Playwright
// that gets *installed*, and only the lockfile names that — see resolved-versions.mjs for why
// reading the declared range instead is a trap rather than a shortcut.
compare('Playwright', [
  ['package-lock.json playwright', resolvedVersion('playwright', 'apps/strategy-practice')],
  [
    `${app}.devcontainer/Dockerfile PLAYWRIGHT_VERSION`,
    read(`${app}.devcontainer/Dockerfile`).match(/^ARG PLAYWRIGHT_VERSION=(.+)$/m)?.[1]
  ]
]);

// devcontainer.json allows comments, which JSON.parse does not — read the version with a regex
// instead, the same way the Dockerfile is read above.
const nodeFeature = file => read(file).match(/features\/node:1"\s*:\s*\{\s*"version"\s*:\s*"(.+?)"/)?.[1];

// A workflow can set Node up in more than one job, so every setup-node step in it is a separate
// place the version comes from — matching only the first would let a second job drift. A step
// either reads the version from a file (`node-version-file: .nvmrc`) or states it
// (`node-version: 24.20.0`); the file is resolved and read, so a step pointed at a file that names
// only a major shows up as a mismatch rather than as a path this check happens to accept.
const workflowNodeVersions = file => {
  const pins = [...read(file).matchAll(/^\s*node-version(-file)?:\s*['"]?([^'"\s]+)/gm)];
  if (pins.length === 0) return [[file, undefined]];
  return pins.map(([, fromFile, value], i) => [
    `${file} setup-node ${i + 1}${fromFile ? ` (${value})` : ''}`,
    fromFile ? (existsSync(`${repoRoot}${value}`) ? read(value).trim() : undefined) : value
  ]);
};

compare('Node', [
  ['.nvmrc', read('.nvmrc').trim()],
  // ">=24.20.0 <25" — only the lower bound names an exact version.
  [`${app}package.json engines.node`, packageJson.engines?.node?.match(/>=\s*(\d+\.\d+\.\d+)/)?.[1]],
  ...workflowNodeVersions('.github/workflows/ci.yml'),
  ...workflowNodeVersions('.github/workflows/practice-pr-test.yml'),
  ...workflowNodeVersions('.github/workflows/pages-deploy.yml'),
  ['.devcontainer/devcontainer.json node feature', nodeFeature('.devcontainer/devcontainer.json')],
  [`${app}.devcontainer/devcontainer.json node feature`, nodeFeature(`${app}.devcontainer/devcontainer.json`)],
  // The image the competition is deployed from.
  ['Dockerfile FROM node', read('Dockerfile').match(/^FROM node:(\S+)/m)?.[1]]
]);

if (errors.length > 0) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}
