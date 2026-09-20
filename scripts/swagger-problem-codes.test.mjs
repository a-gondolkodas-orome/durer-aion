// `swagger.yaml` is the admin API's only description, and nothing in this repo
// reads it, so a code added to the import's problem list reaches every caller
// and leaves the document behind without a word. It did: the three codes a
// re-import draws — the ordinary case, a registration list run again once late
// teams are on it — were missing from the enum, so a generated or validating
// client broke on the answer the server gives most often.
//
// Both sides are read as text. The union is TypeScript, which is gone by the
// time a test runs, and the document is YAML this repo has no parser for; what
// the check is worth does not depend on either being understood in full.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(`${repoRoot}${file}`, 'utf8');

const quoted = text => [...text.matchAll(/'([^']+)'|"([^"]+)"/g)].map(match => match[1] ?? match[2]);

/** The members of the `TeamTsvProblemCode` union, which is the rule itself:
 * the parser and both callers' wordings are typed against it. */
function codesInSource() {
  const union = /export type TeamTsvProblemCode =([\s\S]*?);/.exec(read('packages/schemas/src/team_tsv.ts'));
  expect(union, 'TeamTsvProblemCode is no longer declared in packages/schemas/src/team_tsv.ts.').not.toBeNull();
  return quoted(union[1]);
}

/** The `enum` of `TeamTsvProblem.code`, and not the two enums above it. */
function codesInSwagger() {
  const property = /\n {8}code:\n[\s\S]*?enum:\s*\n?\s*\[([\s\S]*?)\]/.exec(read('swagger.yaml'));
  expect(property, 'TeamTsvProblem.code no longer carries an enum in swagger.yaml.').not.toBeNull();
  return quoted(property[1]);
}

describe('the problem codes swagger.yaml documents', () => {
  const source = codesInSource();
  const swagger = codesInSwagger();

  it('are the ones the parser can report', () => {
    const missing = source.filter(code => !swagger.includes(code));

    expect(
      missing,
      `These problem codes are in TeamTsvProblemCode but not in swagger.yaml's enum: ${missing.join(', ')}. `
      + 'A client generated from the document refuses the answer the moment the server sends one.'
    ).toStrictEqual([]);
  });

  it('holds nothing the parser cannot report', () => {
    const stale = swagger.filter(code => !source.includes(code));

    expect(
      stale,
      `These problem codes are in swagger.yaml's enum but no longer in TeamTsvProblemCode: ${stale.join(', ')}. `
      + 'Drop them from the document.'
    ).toStrictEqual([]);
  });
});
