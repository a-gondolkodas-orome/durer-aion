// Playwright and Node are each written down in several places (README § Project setup lists them),
// and a mismatch stays invisible until something fails far from the cause. Fail the test run
// instead.
//
// Files are compared against each other only — never against the running process.version, so a
// contributor on a slightly different local patch is not blocked.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvedVersion } from '../../../scripts/resolved-versions.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(`${root}${file}`, 'utf8');

// GitHub only reads .github/workflows at the repository root, so this app's workflows live
// there rather than beside the code they run — one directory up from apps/.
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

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
    errors.push(
      `${what} version mismatch:\n` +
        sources.map(([where, version]) => `  ${where.padEnd(44)} ${version}`).join('\n') +
        `\nSet them all to the same version, then rebuild the devcontainer.`
    );
  }
};

const packageJson = JSON.parse(read('package.json'));

// The lockfile rather than package.json: the devcontainer bakes browsers for the Playwright
// that gets *installed*, and only the lockfile names that — see resolved-versions.mjs for why
// reading the declared range instead is a trap rather than a shortcut.
compare('Playwright', [
  ['package-lock.json playwright', resolvedVersion('playwright', 'apps/strategy-practice')],
  [
    '.devcontainer/Dockerfile PLAYWRIGHT_VERSION',
    read('.devcontainer/Dockerfile').match(/^ARG PLAYWRIGHT_VERSION=(.+)$/m)?.[1]
  ]
]);

// devcontainer.json allows comments, which JSON.parse does not — read the version with a regex
// instead, the same way the Dockerfile is read above.
const devcontainer = read('.devcontainer/devcontainer.json');

// A workflow can run more than one containerised job, so every `image: node:` in it is a separate
// place the version is written down — matching only the first would let a second job drift.
const workflowNodeImages = file => {
  const images = [...readFileSync(`${repoRoot}${file}`, 'utf8').matchAll(/^\s*image:\s*node:(.+)$/gm)];
  return images.length === 0 ? [[file, undefined]] : images.map(([, version], i) => [`${file} job ${i + 1}`, version]);
};

compare('Node', [
  ['.nvmrc', read('.nvmrc').trim()],
  // ">=24.11.1 <25" — only the lower bound names an exact version.
  ['package.json engines.node', packageJson.engines?.node?.match(/>=\s*(\d+\.\d+\.\d+)/)?.[1]],
  ...workflowNodeImages('.github/workflows/practice-pr-test.yml'),
  ...workflowNodeImages('.github/workflows/pages-deploy.yml'),
  [
    '.devcontainer/devcontainer.json node feature',
    devcontainer.match(/features\/node:1"\s*:\s*\{\s*"version"\s*:\s*"(.+?)"/)?.[1]
  ]
]);

if (errors.length > 0) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}
