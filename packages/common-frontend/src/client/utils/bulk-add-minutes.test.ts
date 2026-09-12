import { describe, expect, test } from 'vitest';
import { BulkAddMinutesDto } from '../dto/TeamStateDto';
import { bulkAddMinutesMessage, bulkAddMinutesVariant, newGrant } from './bulk-add-minutes';

const result = (fields: Partial<BulkAddMinutesDto> = {}): BulkAddMinutesDto =>
  ({ extended: [], alreadyGranted: [], problems: [], ...fields });

describe('newGrant', () => {
  test('is eight hex characters, short enough to sit in a team’s notes', () => {
    expect(newGrant()).toMatch(/^[0-9a-f]{8}$/);
  });

  test('differs between presses, so a later grant is a new one', () => {
    const grants = new Set(Array.from({ length: 50 }, () => newGrant()));

    expect(grants.size).toBe(50);
  });
});

describe('bulkAddMinutesMessage', () => {
  test('says how many matches took the minutes', () => {
    expect(bulkAddMinutesMessage(result({ extended: ['Alpha', 'Bravo'] }), 10))
      .toBe('2 meccs kapott +10 percet');
  });

  // Naming them is the point: the organiser could not tell which teams were
  // left out, which is what made pressing again dangerous.
  test('names every team that was left out, and why', () => {
    const walked = result({
      extended: ['Alpha'],
      problems: [
        { teamName: 'Bravo', matchID: 'm2', reason: 'no-match-running' },
        { teamName: 'Charlie', matchID: 'm3', reason: 'error' },
      ],
    });

    expect(bulkAddMinutesMessage(walked, 10)).toBe(
      '1 meccs kapott +10 percet, 2 sikertelen: Bravo (nem fut meccs), Charlie (hiba)');
  });

  // The retry case: the walk ran again and found its own work already done.
  test('counts the matches the grant had already covered', () => {
    const walked = result({ extended: ['Alpha'], alreadyGranted: ['Bravo', 'Charlie'] });

    expect(bulkAddMinutesMessage(walked, 5))
      .toBe('1 meccs kapott +5 percet, 2 már megkapta');
  });

  // A reason the server learns to send that this does not know yet should read
  // oddly rather than vanish.
  test('shows a reason it does not know as it came', () => {
    const walked = result({ problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'moon-phase' }] });

    expect(bulkAddMinutesMessage(walked, 10)).toContain('Bravo (moon-phase)');
  });
});

describe('bulkAddMinutesVariant', () => {
  test('is a success when nothing had a problem', () => {
    expect(bulkAddMinutesVariant(result({ extended: ['Alpha'] }))).toBe('success');
  });

  test('is a warning when some of it worked', () => {
    expect(bulkAddMinutesVariant(result({
      extended: ['Alpha'],
      problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'error' }],
    }))).toBe('warning');
  });

  test('is an error when none of it did', () => {
    expect(bulkAddMinutesVariant(result({
      problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'error' }],
    }))).toBe('error');
  });

  // A repeat that moved nothing because it had all been done is not a failure.
  test('is a success when the grant had already covered everything', () => {
    expect(bulkAddMinutesVariant(result({ alreadyGranted: ['Alpha'] }))).toBe('success');
  });
});
