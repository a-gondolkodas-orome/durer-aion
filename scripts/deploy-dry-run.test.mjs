// The dry run is published to a repository whose name is the whole of its protection, so the two
// things worth pinning are that the base path comes out of that repository rather than out of an
// edited file, and that the script refuses the one repository it must never publish to.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { basePathFor, repoNameFromRemote } from './deploy-dry-run.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const script = readFileSync(`${repoRoot}scripts/deploy-dry-run.mjs`, 'utf8');

const PRIVATE_SSH = 'git@github.com:a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1.git';

describe('repoNameFromRemote', () => {
  // The four spellings git leaves in a checkout: ssh is what a maintainer clones with, https is
  // what actions/checkout writes, and either may come without the suffix.
  it.each([
    ['ssh with .git', PRIVATE_SSH],
    ['ssh without .git', 'git@github.com:a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1'],
    ['https with .git', 'https://github.com/a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1.git'],
    ['https without .git', 'https://github.com/a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1'],
  ])('reads owner/repo out of an %s remote', (_name, url) => {
    expect(repoNameFromRemote(url)).toBe('a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1');
  });

  it('reads a remote that git printed with its trailing newline', () => {
    expect(repoNameFromRemote(`${PRIVATE_SSH}\n`)).toBe(
      'a-gondolkodas-orome/durer19o-xn7ElDP7nQm2M1'
    );
  });

  it('refuses a remote it cannot read a name out of', () => {
    expect(() => repoNameFromRemote('/some/local/path')).toThrow(/origin remote/);
  });
});

describe('basePathFor', () => {
  it('derives the base path from the repository, so nothing has to be edited per competition', () => {
    expect(basePathFor(PRIVATE_SSH, {})).toBe('/durer19o-xn7ElDP7nQm2M1/');
  });

  it('lets SITE_BASE override it, which is how a wrong-base bug is reproduced by hand', () => {
    expect(basePathFor(PRIVATE_SSH, { SITE_BASE: '/durer-fake-Xy7/' })).toBe('/durer-fake-Xy7/');
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
    expect(script).toMatch(/turbo', 'build', '--filter=offline-frontend'/);
    expect(script).not.toMatch(/cwd: join\(repoRoot, 'apps\//);
  });

  it('ships no CNAME, so the site stays on its unguessable github.io URL', () => {
    expect(script).toMatch(/existsSync\(join\(dist, 'CNAME'\)\)/);
  });
});
