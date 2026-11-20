import type { CompetitionConfig, CompetitionId, Problem, ProblemId } from 'schemas';
import { competitionName } from 'schemas';
import type { Bundle } from './bundle';
import { sameProblem } from './bundle';
import type { Bank } from './registry';

// A bundle made into a file under banks/: how a competition held in the
// database goes back into code (README § Adding a competition).

/// The bank a bundle makes, beside the banks `registry` holds: its
/// competitions, and those of its problems the registry does not have, which
/// are `leftOut`. A relay that reuses an older problem would otherwise repeat
/// its id, which `createRegistry` refuses. A competition the registry has, or
/// a problem it has in another form, is an error: the bundle is then not one
/// exported from this registry's rounds.
export function bankFromBundle(
  bundle: Bundle,
  registry: { problems: ReadonlyMap<ProblemId, Problem>, competitions: ReadonlyMap<CompetitionId, CompetitionConfig> },
): { bank: Bank, leftOut: ProblemId[] } | { errors: string[] } {
  const errors = Object.keys(bundle.competitions)
    .filter(id => registry.competitions.has(id))
    .map(id => `The competition ${id} is in code already`);
  const problems: Bank['problems'] = {};
  const leftOut: ProblemId[] = [];
  for (const [id, body] of Object.entries(bundle.problems)) {
    const held = registry.problems.get(id);
    if (held === undefined) {
      problems[id] = body;
    } else if (sameProblem(body, held)) {
      leftOut.push(id);
    } else {
      errors.push(`The problem ${id} is in code already, and differs from the bundle's`);
    }
  }
  if (errors.length > 0) return { errors };
  return { bank: { competitions: bundle.competitions, problems }, leftOut };
}

/// The source of a file under banks/ that exports `bank`, formatted as the
/// hand-written ones are, so that ESLint passes it as it is.
export function bankFile(bank: Bank): string {
  const titles = Object.entries(bank.competitions).map(([id, { metadata }]) =>
    competitionName(metadata) ?? (metadata.kind === 'other' ? metadata.label.hu ?? metadata.label.en : undefined) ?? id);
  return [
    "import type { CompetitionBank, ProblemBank } from '../src/sources';",
    '',
    `// ${titles.length === 0 ? 'No competition' : titles.join(', ')}: made from a bundle exported from the database,`,
    '// with the problems their relays use that no other bank holds.',
    '',
    `export const competitions: CompetitionBank = ${literal(bank.competitions, '', 2)};`,
    '',
    `export const problems: ProblemBank = ${literal(bank.problems, '', 2)};`,
    '',
  ].join('\n');
}

/// The longest line a value is written on, if it fits; past it, one entry a
/// line. The banks' problem texts are longer, and stay on one line each.
const LINE = 120;

/// `value` as a TypeScript literal, starting `used` characters into a line
/// indented by `indent`. The top `expand` levels take a line per entry
/// whatever their length, as each competition and problem does in the
/// hand-written banks.
function literal(value: unknown, indent: string, expand: number, used = 0): string {
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value !== 'object' || value === null) throw new Error(`No literal for ${String(value)}`);
  const array = Array.isArray(value);
  const entries: [string | null, unknown][] = array
    ? (value as unknown[]).map(item => [null, item])
    : Object.entries(value).filter(([, item]) => item !== undefined);
  const [open, close] = array ? ['[', ']'] : ['{', '}'];
  if (entries.length === 0) return open + close;
  const entry = ([key, item]: [string | null, unknown], at: string, column: number) => {
    const prefix = key === null ? '' : `${propertyKey(key)}: `;
    return prefix + literal(item, at, expand - 1, column + prefix.length);
  };
  if (expand <= 0) {
    // Measured on its own: a part too long for a line makes the whole too long.
    const inner = entries.map(item => entry(item, '', 0)).join(', ');
    const inline = array ? `[${inner}]` : `{ ${inner} }`;
    if (!inline.includes('\n') && Math.max(used, indent.length) + inline.length < LINE) return inline;
  }
  const at = `${indent}  `;
  return `${open}\n${entries.map(item => `${at}${entry(item, at, at.length)},\n`).join('')}${indent}${close}`;
}

function propertyKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
}

/// Single quotes, or double ones for a text with a single quote in it and no
/// double one, as `@stylistic/quotes` asks with `avoidEscape`.
function quote(text: string): string {
  const mark = text.includes("'") && !text.includes('"') ? '"' : "'";
  let quoted = '';
  for (const char of text) {
    if (char === '\\' || char === mark) quoted += `\\${char}`;
    else if (char === '\n') quoted += '\\n';
    else if (char === '\t') quoted += '\\t';
    else if (char < ' ' || char === ' ' || char === ' ') {
      quoted += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
    } else quoted += char;
  }
  return mark + quoted + mark;
}
