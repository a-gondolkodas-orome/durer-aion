import type { CompetitionConfig, CompetitionId, Problem, ProblemId } from 'schemas';
import { competitionName } from 'schemas';
import type { Bundle } from './bundle';
import { sameBody } from './bundle';
import type { Bank } from './registry';

// A bundle made into a file under banks/: how a competition held in the
// database goes back into code (README § Adding a competition).

/// The bank a bundle makes, beside the banks `registry` holds: the
/// competitions and problems of the bundle the registry does not have. Those
/// it has as the bundle does are `leftOut`, since `createRegistry` refuses an
/// id two banks hold: a relay reuses older problems, and a bundle of every
/// competition on a server holds the in-code ones too. One the registry has in
/// another form is an error, and so is a bundle with no competition left.
export function bankFromBundle(
  bundle: Bundle,
  registry: { problems: ReadonlyMap<ProblemId, Problem>, competitions: ReadonlyMap<CompetitionId, CompetitionConfig> },
): { bank: Bank, leftOut: string[] } | { errors: string[] } {
  const errors: string[] = [];
  const leftOut: string[] = [];
  const notHeld = <T extends object>(kind: string, bodies: Record<string, T>, held: ReadonlyMap<string, object>) => {
    const kept: Record<string, T> = {};
    for (const [id, body] of Object.entries(bodies)) {
      const inCode = held.get(id);
      if (inCode === undefined) kept[id] = body;
      else if (sameBody(body, inCode)) leftOut.push(id);
      else errors.push(`The ${kind} ${id} is in code already, and differs from the bundle's`);
    }
    return kept;
  };
  const competitions = notHeld('competition', bundle.competitions, registry.competitions);
  const problems = notHeld('problem', bundle.problems, registry.problems);
  if (errors.length === 0 && Object.keys(competitions).length === 0) {
    errors.push('Every competition of the bundle is in code already');
  }
  if (errors.length > 0) return { errors };
  return { bank: { competitions, problems }, leftOut };
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
