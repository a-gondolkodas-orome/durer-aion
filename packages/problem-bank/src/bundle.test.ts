import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strategyGames } from 'game';
import { competitionShapeErrors, problemShapeErrors } from 'schemas';
import { registry } from '../all';
import type { Bundle } from './bundle';
import { bundleOf, problemsReferredFrom, readBundle, validateBundle } from './bundle';
import { inCode } from './in-code-for-testing';

const sample: unknown = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'sample-bundle.json'), 'utf8'));

function read(value: unknown): Bundle {
  const result = readBundle(value);
  if ('errors' in result) throw new Error(result.errors.join('\n'));
  return result.bundle;
}

const problem = { answer: 1, content: { hu: { problemText: '1?' } } };
const competition = {
  languages: ['hu'],
  relay: { durationMinutes: 60, problems: [{ problemId: 'aaaaaaaaaa--first', points: 3 }] },
  metadata: { kind: 'other', label: { hu: 'Próba' } },
};
const bundle = (competitions: object, problems: object) =>
  ({ format: 'durer-competitions', version: 1, competitions, problems });

describe('the sample bundle', () => {
  it('is valid against the registry', () => {
    const sampleBundle = read(sample);
    const referred = new Map(problemsReferredFrom(sampleBundle).flatMap(id => {
      const found = registry.problems.get(id);
      return found === undefined ? [] : [[id, found] as const];
    }));
    expect(validateBundle(sampleBundle, referred, strategyGames)).toEqual([]);
  });
});

describe('bundleOf', () => {
  it('makes a bundle that stands alone: valid with no problem from elsewhere', () => {
    const competitions = ['klmgbpb334--minta-teljes', '49tbhzl1jz--minta-valto'].map(id => inCode(registry.competitions, id));
    const made = read(bundleOf(competitions, registry.problems));
    expect(Object.keys(made.competitions)).toEqual(['klmgbpb334--minta-teljes', '49tbhzl1jz--minta-valto']);
    // In the order the relays first use them, each once.
    expect(Object.keys(made.problems)).toEqual([
      'k5g58wuf6h--minta-korongok', '4gmwop64ms--minta-oszthato', '20c8027yvv--minta-kezfogasok',
      'rnq4kflg46--minta-osszeg', 'e7grcn2cq9--minta-szamjegyosszeg', '242slejy21--minta-dobokocka',
    ]);
    expect(problemsReferredFrom(made)).toEqual([]);
    expect(validateBundle(made, new Map(), strategyGames)).toEqual([]);
  });

  it('throws on a relay problem it is not given', () => {
    expect(() => bundleOf([inCode(registry.competitions, '49tbhzl1jz--minta-valto')], new Map()))
      .toThrow('k5g58wuf6h--minta-korongok');
  });
});

// The shape check is written out by hand beside the types, so a field the
// types gain and it does not would refuse every bundle that uses it.
describe('every competition and problem held in code', () => {
  it('has the shape a bundle is read with', () => {
    const errors = [
      ...[...registry.problems].flatMap(([id, { id: _, ...body }]) => problemShapeErrors(id, body)),
      ...[...registry.competitions].flatMap(([id, { id: _, ...body }]) => competitionShapeErrors(id, body)),
    ];
    expect(errors).toEqual([]);
  });
});

describe('readBundle', () => {
  it('reads a bundle of the right shape', () => {
    const value = bundle({ 'bbbbbbbbbb--set': competition }, { 'aaaaaaaaaa--first': problem });
    expect(readBundle(value)).toEqual({ bundle: value });
  });

  it.each([
    [[], 'A fájl nem egy JSON objektum.'],
    [{ ...bundle({}, {}), format: 'other' }, 'A fájl nem versenycsomag: a format mezője „durer-competitions” kell legyen.'],
    [{ ...bundle({}, {}), version: 2 }, 'A versenycsomag 2. változatát nem ismerjük, csak a 1.-et.'],
    [bundle({}, {}), 'A versenycsomag üres: nincs benne sem verseny, sem feladat.'],
    [bundle([], {}), 'A competitions mező nem objektum.'],
  ])('refuses %j', (value, message) => {
    expect(readBundle(value)).toEqual({ errors: [message] });
  });

  it('names every field of the wrong shape, missing or unknown', () => {
    const value = {
      ...bundle(
        {
          'bbbbbbbbbb--set': {
            ...competition,
            languages: 'hu',
            advancingPoint: 10,
            relay: { durationMinutes: '60', problems: [{ problemId: 'aaaaaaaaaa--first' }] },
            metadata: { kind: 'round' },
          },
        },
        {
          'aaaaaaaaaa--first': { content: { hu: { problemText: 1, imageUrl: null } } },
          'cccccccccc--second': 'text',
        },
      ),
      extra: true,
    };
    expect(readBundle(value)).toEqual({
      errors: [
        'Ismeretlen mező a versenycsomagban: extra',
        'feladat aaaaaaaaaa--first: hiányzik az answer',
        'feladat aaaaaaaaaa--first: a content.hu.problemText nem szöveg',
        'feladat aaaaaaaaaa--first: a content.hu.imageUrl nem szöveg',
        'feladat cccccccccc--second: nem objektum',
        'verseny bbbbbbbbbb--set: a languages nem lista',
        'verseny bbbbbbbbbb--set: a relay.durationMinutes nem szám',
        'verseny bbbbbbbbbb--set: hiányzik a relay.problems[0].points',
        'verseny bbbbbbbbbb--set: a metadata.kind „competition” vagy „other” kell legyen',
        'verseny bbbbbbbbbb--set: ismeretlen mező: advancingPoint',
      ],
    });
  });
});

describe('validateBundle', () => {
  it('reports what breaks the rules, with problems the server has as references', () => {
    const value = read(bundle(
      {
        'bbbbbbbbbb--set': {
          ...competition,
          relay: { durationMinutes: 60, problems: [
            { problemId: 'aaaaaaaaaa--first', points: 3 },
            { problemId: 'dddddddddd--held', points: 3 },
            { problemId: 'eeeeeeeeee--missing', points: 3 },
          ] },
        },
        'aaaaaaaaaa--first': competition,
      },
      { 'aaaaaaaaaa--first': { ...problem, answer: 1.5 } },
    ));
    expect(problemsReferredFrom(value)).toEqual(['dddddddddd--held', 'eeeeeeeeee--missing']);
    const held = new Map([['dddddddddd--held', { ...problem, id: 'dddddddddd--held' }]]);
    expect(validateBundle(value, held, strategyGames)).toEqual([
      'feladat aaaaaaaaaa--first: a válasz (1.5) nem egész szám',
      'verseny bbbbbbbbbb--set: a váltó 3. feladata (eeeeeeeeee--missing) nem létezik',
      'aaaaaaaaaa--first egy feladat és egy verseny azonosítója is',
    ]);
  });
});
