// Playwright and Node are each written down in several places — the two tests below are the list
// of where, and what everything else pointing at "the files the version is repeated in" means — and
// a mismatch stays invisible until something fails far from the cause. Fail the test run instead.
//
// Files are compared against each other only — never against the running process.version, so a
// contributor on a slightly different local patch is not blocked.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolvedVersion } from '../resolved-versions.mjs';

// Every path here is repository-relative: Node is the whole repository's pin, and GitHub only
// reads .github/workflows at the repository root anyway.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
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
      ['package-lock.json playwright', resolvedVersion('playwright')],
      [
        `${app}.devcontainer/Dockerfile PLAYWRIGHT_VERSION`,
        read(`${app}.devcontainer/Dockerfile`).match(/^ARG PLAYWRIGHT_VERSION=(.+)$/m)?.[1]
      ]
    ]);
  });

  it('Node: .nvmrc, both engines.node, every setup-node step, both devcontainers and the Dockerfile agree', () => {
    const workflows = workflowNodeVersions();
    // A pattern that stopped matching would otherwise pass by finding nothing to compare.
    expect(workflows.length, 'no setup-node pin found under .github/workflows — is the pattern stale?').toBeGreaterThan(0);
    // ">=26.13.0 <27" — only the lower bound names an exact version.
    const engines = file => JSON.parse(read(file)).engines?.node?.match(/>=\s*(\d+\.\d+\.\d+)/)?.[1];
    expectAgreement('Node', [
      ['.nvmrc', read('.nvmrc').trim()],
      ['package.json engines.node', engines('package.json')],
      [`${app}package.json engines.node`, engines(`${app}package.json`)],
      ...workflows,
      ['.devcontainer/devcontainer.json node feature', nodeFeature('.devcontainer/devcontainer.json')],
      [`${app}.devcontainer/devcontainer.json node feature`, nodeFeature(`${app}.devcontainer/devcontainer.json`)],
      // The image the competition is deployed from.
      ['Dockerfile FROM node', read('Dockerfile').match(/^FROM node:(\S+)/m)?.[1]]
    ]);
  });

  it('Node: the devcontainer base images and @types/node are on the .nvmrc major', () => {
    // MCR tags these images by major alone, so the major is all they can agree on; the node
    // feature compared above is what pins the exact version inside them.
    const rootPackage = JSON.parse(read('package.json'));
    expectAgreement('Node major', [
      ['.nvmrc', read('.nvmrc').trim().split('.')[0]],
      // The types track the runtime — DEPENDENCIES.md § Held back deliberately.
      [
        'apps/online-backend/package.json @types/node',
        JSON.parse(read('apps/online-backend/package.json')).devDependencies?.['@types/node']?.split('.')[0]
      ],
      // i18n-check pulls in a CLI library that asks for `@types/node` `22 || 24`, though nothing
      // here compiles its types; left alone, it keeps a second, older copy in the tree that
      // every other `*` dependent dedupes onto. The override lets the one copy follow the runtime.
      [
        'package.json overrides @lingual/i18n-check @types/node',
        rootPackage.overrides?.['@lingual/i18n-check']?.['@types/node']
      ],
      [
        '.devcontainer/devcontainer.json image',
        read('.devcontainer/devcontainer.json').match(/"image"\s*:\s*"[^"]*-node:(\d+)/)?.[1]
      ],
      [
        `${app}.devcontainer/Dockerfile FROM`,
        read(`${app}.devcontainer/Dockerfile`).match(/^FROM \S+-node:(\d+)/m)?.[1]
      ]
    ]);
  });
});
