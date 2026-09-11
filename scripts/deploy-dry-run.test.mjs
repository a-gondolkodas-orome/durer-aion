// The dry run is published to a repository whose name is the whole of its protection, so what is
// worth pinning is that the base path comes out of that repository rather than out of an edited
// file, that the script refuses the one repository it must never publish to, and that the commit
// it pushes is one git will make.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { COMMITTER, basePathFor, binOf, publish, repoNameFromRemote } from './deploy-dry-run.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const script = readFileSync(`${repoRoot}scripts/deploy-dry-run.mjs`, 'utf8');

// A deliberately obvious placeholder. The real thing is a random-looking string kept secret
// until the competition is over, and a fixture shaped like one reads as if it were the leaked
// name rather than test data — which is the mistake #296 exists to stop repeating.
const PRIVATE_SSH = 'git@github.com:a-gondolkodas-orome/durer-example-not-a-real-repo.git';

describe('repoNameFromRemote', () => {
  // The four spellings git leaves in a checkout: ssh is what a maintainer clones with, https is
  // what actions/checkout writes, and either may come without the suffix.
  it.each([
    ['ssh with .git', PRIVATE_SSH],
    ['ssh without .git', 'git@github.com:a-gondolkodas-orome/durer-example-not-a-real-repo'],
    ['https with .git', 'https://github.com/a-gondolkodas-orome/durer-example-not-a-real-repo.git'],
    ['https without .git', 'https://github.com/a-gondolkodas-orome/durer-example-not-a-real-repo'],
  ])('reads owner/repo out of an %s remote', (_name, url) => {
    expect(repoNameFromRemote(url)).toBe('a-gondolkodas-orome/durer-example-not-a-real-repo');
  });

  it('reads a remote that git printed with its trailing newline', () => {
    expect(repoNameFromRemote(`${PRIVATE_SSH}\n`)).toBe(
      'a-gondolkodas-orome/durer-example-not-a-real-repo'
    );
  });

  it('refuses a remote it cannot read a name out of', () => {
    expect(() => repoNameFromRemote('/some/local/path')).toThrow(/origin remote/);
  });
});

describe('basePathFor', () => {
  it('derives the base path from the repository, so nothing has to be edited per competition', () => {
    expect(basePathFor(PRIVATE_SSH, {})).toBe('/durer-example-not-a-real-repo/');
  });

  it('lets SITE_BASE override it, which is how a wrong-base bug is reproduced by hand', () => {
    const override = '/durer-example-overridden/';

    expect(basePathFor(PRIVATE_SSH, { SITE_BASE: override })).toBe(override);
  });

  // The public repo's Pages is pages-deploy.yml's, and the checkout this would run from is the
  // one every contributor has — so the mistake is easy and its symptom is nothing at all.
  it.each([
    'git@github.com:a-gondolkodas-orome/durer-aion.git',
    'https://github.com/a-gondolkodas-orome/durer-aion',
  ])('refuses to publish to the public repository (%s)', url => {
    expect(() => basePathFor(url, {})).toThrow(/public repository/);
  });
});

describe('deploy-dry-run.mjs', () => {
  it('builds through turbo, not with a bare build inside the app', () => {
    // Same reason as scripts/assemble-site.test.mjs: without `^build` in front of it a workspace
    // package the app imports has no dist (#451). A `cwd` into an app is the tell.
    expect(script).toMatch(/'turbo\/bin\/turbo', \['build', '--filter=offline-frontend'\]/);
    expect(script).not.toMatch(/cwd: join\(repoRoot, 'apps\//);
  });

  // #483/#484: npm and npx are `.cmd` on Windows, and node cannot exec one without a shell — the
  // spawn fails outright instead of the command running. The one bin left here is a node script,
  // so the node binary already running this script runs it and no shell is needed anywhere.
  it('runs its tools with node rather than through npx, which is a .cmd on Windows', () => {
    expect(script).not.toMatch(/execFileSync\('np[mx]'|run\('np[mx]'/);
    expect(script).toMatch(/run\(process\.execPath, \[binOf\(specifier\)/);
  });

  it('never asks for a shell, which on Windows would reinterpret what it is given', () => {
    expect(script).not.toMatch(/shell:/);
  });

  it('resolves the turbo bin', () => {
    expect(binOf('turbo/bin/turbo')).toMatch(/node_modules/);
  });

  it('ships no CNAME, so the site stays on its unguessable github.io URL', () => {
    expect(script).toMatch(/existsSync\(join\(dist, 'CNAME'\)\)/);
  });
});

// All the identity has to do is reach a commit, and as a `-u` string for the gh-pages bin it did
// not: the bin parses that argument as an RFC 5322 address, so the deploy died on the name of the
// bot it deploys as — every time, after the build, at the last step.
describe('the committer', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'deploy-dry-run-'));
  const origin = join(tmp, 'origin.git');
  const site = join(tmp, 'site');
  const cacheDir = process.env.CACHE_DIR;

  afterAll(() => {
    process.env.CACHE_DIR = cacheDir;
    rmSync(tmp, { recursive: true, force: true });
  });

  it('commits as a name git takes literally, brackets and all', async () => {
    execFileSync('git', ['init', '--quiet', '--bare', origin]);
    mkdirSync(site);
    writeFileSync(join(site, 'index.html'), '<!doctype html>\n');
    // gh-pages clones the repository it publishes to; keep that clone of a throwaway origin out
    // of the repository's own node_modules/.cache, where it would outlive this test.
    process.env.CACHE_DIR = join(tmp, 'cache');

    // Square brackets are legal in neither a display name nor a local part, so the publish now
    // hands gh-pages the name and the email as fields and leaves no address to parse.
    await publish(site, { repo: origin, user: COMMITTER, message: 'test' });

    const committer = execFileSync(
      'git', ['--git-dir', origin, 'log', 'gh-pages', '-1', '--format=%an <%ae>']
    ).toString().trim();

    expect(committer).toBe(`${COMMITTER.name} <${COMMITTER.email}>`);
  });
});
