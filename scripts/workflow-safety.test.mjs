// Two ways a workflow hands a secret away, both of which read as ordinary shell until you look
// twice, and neither of which any linter here would catch. They are properties of every workflow
// rather than of the one that had them, so this walks the directory instead of listing files: a
// workflow added later is covered the day it lands.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = '.github/workflows/';
const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// Normalised so CRLF line endings stay off every pattern below. sync.yml was the file that had
// them, until the shell in it moved to scripts/sync-mirror.mjs.
const workflows = () =>
  readdirSync(`${repoRoot}${WORKFLOWS}`)
    .filter(name => /\.ya?ml$/.test(name))
    .sort()
    .map(name => [`${WORKFLOWS}${name}`, readFileSync(`${repoRoot}${WORKFLOWS}${name}`, 'utf8').replace(/\r\n/g, '\n')]);

// The body of every `run:`, whether written inline or as a block scalar. A block ends at the first
// line indented no further than the `run:` key itself — the next step, or the next key of this one.
const runScripts = source => {
  const lines = source.split('\n');
  const scripts = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:- )?run:(.*)$/.exec(lines[i]);
    if (!match) continue;
    const [, indent, rest] = match;
    const start = i + 1;
    if (!/^\s*[|>]/.test(rest)) {
      scripts.push({ start, body: rest });
      continue;
    }
    const body = [];
    while (i + 1 < lines.length && (lines[i + 1].trim() === '' || lines[i + 1].search(/\S/) > indent.length)) {
      body.push(lines[++i]);
    }
    scripts.push({ start, body: body.join('\n') });
  }
  return scripts;
};

// Each offending line as `path:line: text`, so a failure is the list of edits to make.
const offenders = (pattern, within = script => script.body.split('\n').map((text, i) => [i, text])) =>
  workflows().flatMap(([file, source]) =>
    runScripts(source).flatMap(script =>
      within(script)
        .filter(([, text]) => pattern.test(text))
        .map(([offset, text]) => `${file}:${script.start + offset}: ${text.trim()}`)
    )
  );

describe('a workflow that runs a shell script', () => {
  it('never expands a ${{ }} expression inside it', () => {
    // Actions substitutes the expression into the script before a shell ever parses it, so a value
    // someone else chooses — a branch name, an issue title, a commit message — becomes executable
    // text at that point. Passing it through `env:` and reading `"$VAR"` makes it a value again.
    expect(offenders(/\$\{\{/), 'Pass these through the step\'s `env:` block and quote them:').toEqual([]);
  });

  it('never puts a secret in a URL', () => {
    // `https://user:$TOKEN@host/...` given to `git remote add` is written verbatim into
    // .git/config, and from there into whatever later reads the checkout. GIT_ASKPASS hands git
    // the token when it asks for one instead, leaving nothing on disk.
    expect(offenders(/https?:\/\/[^\s'"]*\$[^\s'"]*@/), 'Use a credential helper or GIT_ASKPASS instead:').toEqual([]);
  });
});

// Which repository a workflow may run in is the other property no linter checks, and three
// workflows here reach outside their own. The two Pages ones are guarded in opposite directions:
// one publishes the public site, the other the private dry run. A lost guard has no symptom until
// the wrong site is serving the wrong thing — gyakorlo.durerinfo.hu replaced by the dry run, or
// the unreleased game published.
const source = name => workflows().find(([file]) => file === `${WORKFLOWS}${name}`)?.[1];

const PUBLIC_REPO = 'a-gondolkodas-orome/durer-aion';

describe('the two Pages workflows', () => {
  it('runs the public site deploy only in the public repository', () => {
    expect(source('pages-deploy.yml')).toContain(`if: github.repository == '${PUBLIC_REPO}'`);
  });

  it('runs the dry run deploy anywhere but the public repository', () => {
    expect(source('dry-run-deploy.yml')).toContain(`if: github.repository != '${PUBLIC_REPO}'`);
  });

  it('gives the dry run deploy a credential to clone and push with', () => {
    // The one thing the job needs that actions/checkout does not leave it: gh-pages publishes
    // from a clone of its own, which inherits neither the workspace's config nor the credentials
    // in it, so a private repo's clone fails outright. Losing this breaks a deploy that is only
    // ever run by hand, months apart — see the same helper, and why it is not a URL, in
    // scripts/sync-mirror.mjs.
    const workflow = source('dry-run-deploy.yml');

    expect(workflow).toMatch(/GITHUB_TOKEN: \$\{\{ (?:github\.token|secrets\.GITHUB_TOKEN) \}\}/);
    expect(workflow).toContain('export GIT_ASKPASS=');
  });

  it('publishes the dry run on demand only', () => {
    // A push must not publish it: the year's game is on that repo's branches while it is still
    // secret, and the site it deploys to is public to anyone holding the URL.
    const triggers = /\non:([\s\S]*?)(?:\n\w|$)/.exec(source('dry-run-deploy.yml'))[1];
    expect(triggers).toContain('workflow_dispatch');
    expect(triggers).not.toContain('push');
  });
});

describe('the mirror sync', () => {
  it('runs only in the public repository', () => {
    // The mirror carries .github/workflows too, so the private repo holds a copy of this
    // workflow and a `sync-*` branch pushed there fires it. This line is the whole of what stops
    // that copy from running — and what it would run is a push, outward, from the secret side.
    expect(source('sync.yml')).toContain(`if: github.repository == '${PUBLIC_REPO}'`);
  });

  it('checks out without a credential, which would otherwise outrank the PAT', () => {
    // actions/checkout writes `http.https://github.com/.extraheader`, and that header is
    // host-wide rather than per-repository: git sends this repository's token to the private
    // mirror too, in place of the PAT the push needs.
    expect(source('sync.yml')).toContain('persist-credentials: false');
  });
});
