// cspell:ignore aeiou
// Whether a value read from outside the code — an uploaded bundle, a request
// body — has the shape of a problem or a competition, before the validator
// (competition-validation.ts) checks it against the rules. The validator takes
// the types on trust, and would throw on a missing field rather than report
// it. A field the types do not have is refused too: a misspelt optional field
// would otherwise vanish without a word.

// A field as a message's subject, with the Hungarian article it takes, `az`
// before a vowel, accented or not; nothing for the whole value, which the
// message's prefix names.
function subject(path: string) {
  if (path === '') return '';
  return `${/^[aeiou]/iu.test(path.normalize('NFD')) ? 'az' : 'a'} ${path} `;
}

type Check = (value: unknown, path: string, errors: string[]) => void;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const string: Check = (value, path, errors) => {
  if (typeof value !== 'string') errors.push(`${subject(path)}nem szöveg`);
};

const number: Check = (value, path, errors) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${subject(path)}nem szám`);
};

/// An object with exactly these fields, the ones marked optional allowed to
/// be missing. `null` is not missing: JSON has no `undefined`, so a field it
/// does not have is left out.
function object(fields: Record<string, { check: Check, optional?: boolean }>): Check {
  return (value, path, errors) => {
    if (!isRecord(value)) {
      errors.push(`${subject(path)}nem objektum`);
      return;
    }
    for (const [key, { check, optional }] of Object.entries(fields)) {
      const at = path === '' ? key : `${path}.${key}`;
      if (value[key] === undefined) {
        if (optional !== true) errors.push(`hiányzik ${subject(at).trimEnd()}`);
      } else {
        check(value[key], at, errors);
      }
    }
    for (const key of Object.keys(value)) {
      if (!(key in fields)) errors.push(`ismeretlen mező: ${path === '' ? key : `${path}.${key}`}`);
    }
  };
}

/// An object of any keys, each value of `each`. Which keys are allowed, such
/// as languages, is the validator's to say.
function record(each: Check): Check {
  return (value, path, errors) => {
    if (!isRecord(value)) {
      errors.push(`${subject(path)}nem objektum`);
      return;
    }
    for (const [key, entry] of Object.entries(value)) each(entry, `${path}.${key}`, errors);
  };
}

function array(each: Check): Check {
  return (value, path, errors) => {
    if (!Array.isArray(value)) {
      errors.push(`${subject(path)}nem lista`);
      return;
    }
    value.forEach((entry, index) => { each(entry, `${path}[${index}]`, errors); });
  };
}

const label = record(string);

const problemBody = object({
  answer: { check: number },
  content: {
    check: record(object({
      problemText: { check: string },
      imageUrl: { check: string, optional: true },
      help1: { check: string, optional: true },
      help2: { check: string, optional: true },
    })),
  },
});

const competitionMetadata: Check = (value, path, errors) => {
  const kind = isRecord(value) ? value.kind : undefined;
  if (kind === 'competition') {
    object({
      kind: { check: string },
      edition: { check: number },
      round: { check: string },
      category: { check: string },
      label: { check: label, optional: true },
    })(value, path, errors);
  } else if (kind === 'other') {
    object({ kind: { check: string }, label: { check: label } })(value, path, errors);
  } else if (!isRecord(value)) {
    errors.push(`${subject(path)}nem objektum`);
  } else {
    errors.push(`${subject(`${path}.kind`)}„competition” vagy „other” kell legyen`);
  }
};

const competitionBody = object({
  languages: { check: array(string) },
  startWindow: {
    check: object({ opensAt: { check: string }, closesAt: { check: string, optional: true } }),
    optional: true,
  },
  relay: {
    check: object({
      durationMinutes: { check: number },
      problems: { check: array(object({ problemId: { check: string }, points: { check: number } })) },
    }),
    optional: true,
  },
  strategy: {
    check: object({ durationMinutes: { check: number }, gameId: { check: string } }),
    optional: true,
  },
  advancingPoints: { check: number, optional: true },
  finishMessage: { check: label, optional: true },
  metadata: { check: competitionMetadata },
});

/// Every way `body` falls short of the shape of a `Problem` without its id,
/// as messages naming the problem `id`; none means `validateProblem` may take
/// it.
export function problemShapeErrors(id: string, body: unknown): string[] {
  const errors: string[] = [];
  problemBody(body, '', errors);
  return errors.map(error => `feladat ${id}: ${error}`);
}

/// `problemShapeErrors` for a `CompetitionConfig` without its id.
export function competitionShapeErrors(id: string, body: unknown): string[] {
  const errors: string[] = [];
  competitionBody(body, '', errors);
  return errors.map(error => `verseny ${id}: ${error}`);
}
