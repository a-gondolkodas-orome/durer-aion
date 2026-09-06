// Two ways a workflow hands a secret away, both of which read as ordinary shell until you look
// twice, and neither of which any linter here would catch. They are properties of every workflow
// rather than of the one that had them, so this walks the directory instead of listing files: a
// workflow added later is covered the day it lands.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = '.github/workflows/';
const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// sync.yml is stored with CRLF line endings; normalising here keeps that off every pattern below.
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
