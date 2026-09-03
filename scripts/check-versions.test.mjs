// Playwright and Node are each written down in several places — Node's are listed in the root
// README § Requirements, Playwright's in apps/strategy-practice/README.md § Project setup — and a
// mismatch stays invisible until something fails far from the cause. Fail the test run instead.
//
// Files are compared against each other only — never against the running process.version, so a
// contributor on a slightly different local patch is not blocked.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolvedVersion } from './resolved-versions.mjs';

// Every path here is repository-relative: Node is the whole repository's pin, and GitHub only
// reads .github/workflows at the repository root anyway. Only Playwright is the practice app's alone.
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');
const app = 'apps/strategy-practice/';

// "where it is written down" -> "what it says", padded so a mismatch reads as a table of edits.
const table = sources => {
  const width = Math.max(...sources.map(([where]) => where.length));
  return sources.map(([where, version]) => `  ${where.padEnd(width)} ${version ?? '(not found)'}`).join('\n');
};

// Two assertions rather than one on a Set's size: each failure carries the whole table, so the
// report is the list of files to edit rather than "expected 2 to be 1".
const expectAgreement = (what, sources) => {
  const missing = sources.filter(([, version]) => !version).map(([where]) => where);
  expect(missing, `Could not find the ${what} version in: ${missing.join(', ')}\n${table(sources)}`).toEqual([]);
  const versions = new Set(sources.map(([, version]) => version));
  expect(
    versions.size,
    `${what} version mismatch:\n${table(sources)}\nSet them all to the same version, then rebuild the devcontainer.`
  ).toBe(1);
};

// devcontainer.json allows comments, which JSON.parse does not — read the version with a regex
// instead, the same way the Dockerfile is read below.
const nodeFeature = file => read(file).match(/features\/node:1"\s*:\s*\{\s*"version"\s*:\s*"(.+?)"/)?.[1];

// Every workflow, not a list: one added with a setup-node step is covered the day it lands, and
// one deleted is not a stale row. A workflow with no pin — sync.yml runs no Node, the dependency
// report runs on the runner's — is simply not a source. Within a workflow every setup-node step
// counts, since a second job could drift from the first. A step either reads the version from a
// file (`node-version-file: .nvmrc`) or states it (`node-version: 24.20.0`); the file is resolved
// and read, so a step pointed at a file naming only a major shows up as a mismatch rather than as
// a path this check happens to accept.
const WORKFLOWS = '.github/workflows/';
const workflowNodeVersions = () =>
  readdirSync(`${repoRoot}${WORKFLOWS}`)
    .filter(name => /\.ya?ml$/.test(name))
    .sort()
    .flatMap(name => {
      const file = `${WORKFLOWS}${name}`;
      return [...read(file).matchAll(/^\s*node-version(-file)?:\s*['"]?([^'"\s]+)/gm)].map(([, fromFile, value], i) => [
        `${file} setup-node ${i + 1}${fromFile ? ` (${value})` : ''}`,
        fromFile ? (existsSync(`${repoRoot}${value}`) ? read(value).trim() : undefined) : value
      ]);
    });

describe('a version written down in more than one file', () => {
  it('Playwright: the lockfile and the practice devcontainer Dockerfile agree', () => {
    // The lockfile rather than package.json: the devcontainer bakes browsers for the Playwright
    // that gets *installed*, and only the lockfile names that — see resolved-versions.mjs.
    expectAgreement('Playwright', [
      ['package-lock.json playwright', resolvedVersion('playwright', 'apps/strategy-practice')],
      [
        `${app}.devcontainer/Dockerfile PLAYWRIGHT_VERSION`,
        read(`${app}.devcontainer/Dockerfile`).match(/^ARG PLAYWRIGHT_VERSION=(.+)$/m)?.[1]
      ]
    ]);
  });

  it('Node: .nvmrc, engines.node, every setup-node step, both devcontainers and the Dockerfile agree', () => {
    const workflows = workflowNodeVersions();
    // A pattern that stopped matching would otherwise pass by finding nothing to compare.
    expect(workflows.length, 'no setup-node pin found under .github/workflows — is the pattern stale?').toBeGreaterThan(0);
    const packageJson = JSON.parse(read(`${app}package.json`));
    expectAgreement('Node', [
      ['.nvmrc', read('.nvmrc').trim()],
      // ">=24.20.0 <25" — only the lower bound names an exact version.
      [`${app}package.json engines.node`, packageJson.engines?.node?.match(/>=\s*(\d+\.\d+\.\d+)/)?.[1]],
      ...workflows,
      ['.devcontainer/devcontainer.json node feature', nodeFeature('.devcontainer/devcontainer.json')],
      [`${app}.devcontainer/devcontainer.json node feature`, nodeFeature(`${app}.devcontainer/devcontainer.json`)],
      // The image the competition is deployed from.
      ['Dockerfile FROM node', read('Dockerfile').match(/^FROM node:(\S+)/m)?.[1]]
    ]);
  });
});
