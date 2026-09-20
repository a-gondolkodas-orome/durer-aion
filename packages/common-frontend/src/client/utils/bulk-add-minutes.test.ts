// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BulkAddMinutesDto } from '../dto/TeamStateDto';
import {
  bulkAddMinutesMessage,
  bulkAddMinutesRetryable,
  bulkAddMinutesRetryMessage,
  bulkAddMinutesVariant,
  forgetGrant,
  grantFor,
  pendingGrantStorageKey,
} from './bulk-add-minutes';

// The grant outlives a render on purpose, so it outlives a test too.
beforeEach(() => {
  forgetGrant();
  vi.restoreAllMocks();
});

const result = (fields: Partial<BulkAddMinutesDto> = {}): BulkAddMinutesDto =>
  ({ extended: [], alreadyGranted: [], problems: [], ...fields });

describe('grantFor', () => {
  const MINUTE = 60 * 1000;

  // Short enough to sit in a team's notes, and within what the route takes
  // (`isGrant` in the backend's `add_minutes.ts`).
  test('is eight hex characters', () => {
    expect(grantFor(10)).toMatch(/^[0-9a-f]{8}$/);
  });

  test('differs between extensions, so a later grant is a new one', () => {
    const grants = new Set(Array.from({ length: 50 }, () => {
      forgetGrant();
      return grantFor(10);
    }));

    expect(grants.size).toBe(50);
  });

  test('is the same grant again while the walk it belongs to has not answered', () => {
    expect(grantFor(10)).toBe(grantFor(10));
  });

  test('is a new grant once the walk has answered', () => {
    const first = grantFor(10);
    forgetGrant();

    expect(grantFor(10)).not.toBe(first);
  });

  // A different number of minutes is a different intent, not a retry.
  test('is a new grant for a different number of minutes', () => {
    expect(grantFor(20)).not.toBe(grantFor(10));
  });

  // The case a ref could not cover: the organiser sees nothing happening and
  // reloads, and the retry has to be the same extension rather than a second
  // one on top of every match the abandoned walk already reached.
  test('survives a reload, which is what it is in storage for', () => {
    // What the page before the reload left behind.
    window.localStorage.setItem(
      pendingGrantStorageKey, JSON.stringify({ minutes: 10, grant: 'deadbeef', at: Date.now() }));

    expect(grantFor(10)).toBe('deadbeef');
  });

  test('is a new grant once the one in storage is old enough to be another day’s', () => {
    const started = Date.now();
    const first = grantFor(10, started);

    expect(grantFor(10, started + 31 * MINUTE)).not.toBe(first);
  });

  test('is still the same grant while the last attempt is recent', () => {
    const started = Date.now();
    const first = grantFor(10, started);

    expect(grantFor(10, started + 29 * MINUTE)).toBe(first);
  });

  // The window runs from the last attempt rather than the first, so an
  // organiser who keeps pressing is still retrying the same extension.
  test('is kept alive by being asked for again', () => {
    const started = Date.now();
    const first = grantFor(10, started);
    grantFor(10, started + 25 * MINUTE);

    expect(grantFor(10, started + 45 * MINUTE)).toBe(first);
  });

  // A private window, or storage turned off. The reload case is beyond saving
  // there, but pressing again in the same page must still be the retry.
  test('still answers with one grant when the browser refuses storage', () => {
    const denied = () => { throw new Error('storage is not available'); };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);

    expect(grantFor(10)).toBe(grantFor(10));
  });

  // The awkward half of that: a browser that reads happily and refuses to
  // write, where an empty read means the write never landed rather than that
  // nothing is pending.
  test('still answers with one grant when the browser refuses only to write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is full');
    });

    expect(grantFor(10)).toBe(grantFor(10));
  });

  test('ignores something else’s value under the same key', () => {
    window.localStorage.setItem(pendingGrantStorageKey, 'not json');

    expect(grantFor(10)).toMatch(/^[0-9a-f]{8}$/);
  });

  test('ignores a stored value that is json but not a grant', () => {
    window.localStorage.setItem(pendingGrantStorageKey, JSON.stringify({ minutes: 10 }));

    expect(grantFor(10)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('bulkAddMinutesMessage', () => {
  test('says how many matches took the minutes', () => {
    expect(bulkAddMinutesMessage(result({ extended: ['Alpha', 'Bravo'] }), 10))
      .toBe('2 meccs kapott +10 percet');
  });

  // Taking time back is the same operation, and the organisers use it.
  test('says minus once when time was taken back, not "+-"', () => {
    expect(bulkAddMinutesMessage(result({ extended: ['Alpha'] }), -10))
      .toBe('1 meccs kapott -10 percet');
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
      '1 meccs kapott +10 percet, 2 sikertelen: Bravo (nem fut meccs), Charlie (hiba)'
      + ' — nyomd meg újra, a már meghosszabbított meccsek nem kapnak kétszer időt.');
  });

  // Naming the teams left out is what invites the second press, so the same
  // line has to say what that press would do. Here it can only help: the
  // grant is kept, and the matches already moved are not moved again.
  test('says the button is the retry when something threw', () => {
    const walked = result({
      extended: ['Alpha'],
      problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'error' }],
    });

    expect(bulkAddMinutesMessage(walked, 10)).toContain('nyomd meg újra');
  });

  // And here it cannot: a refused match is refused again, and the walk being
  // finished, the press is a second extension for everyone it did move.
  test('says what pressing again would cost when nothing can be retried', () => {
    const walked = result({
      extended: ['Alpha'],
      problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'no-match-running' }],
    });

    const message = bulkAddMinutesMessage(walked, 10);

    expect(message).toContain('az újbóli megnyomás sem segít');
    expect(message).toContain('újra kapna időt');
  });

  // With nothing moved there is nothing a second press could move twice.
  test('warns about no second extension when the walk moved nothing', () => {
    const walked = result({ problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'no-match-running' }] });

    expect(bulkAddMinutesMessage(walked, 10)).toBe('0 meccs kapott +10 percet, 1 sikertelen: Bravo (nem fut meccs)');
  });

  // The retry case: the walk ran again and found its own work already done.
  test('counts the matches the grant had already covered', () => {
    const walked = result({ extended: ['Alpha'], alreadyGranted: ['Bravo', 'Charlie'] });

    expect(bulkAddMinutesMessage(walked, 5))
      .toBe('1 meccs kapott +5 percet, 2 már megkapta');
  });

  // A walk at the end of a round can leave out every match that has just
  // finished, and the whole list in one snackbar line is not readable.
  test('names ten of the teams left out and counts the rest', () => {
    const walked = result({
      problems: Array.from({ length: 12 }, (_unused, index) => ({
        teamName: `Csapat ${index}`, matchID: `m${index}`, reason: 'no-match-running',
      })),
    });

    const message = bulkAddMinutesMessage(walked, 10);

    expect(message).toContain('12 sikertelen: Csapat 0 (nem fut meccs)');
    expect(message).toContain('Csapat 9 (nem fut meccs) és még 2');
    expect(message).not.toContain('Csapat 10');
  });

  test('counts nothing extra when every team left out is named', () => {
    const walked = result({ problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'error' }] });

    expect(bulkAddMinutesMessage(walked, 10)).toBe(
      '0 meccs kapott +10 percet, 1 sikertelen: Bravo (hiba)'
      + ' — nyomd meg újra, a már meghosszabbított meccsek nem kapnak kétszer időt.');
  });

  // A reason the server learns to send that this does not know yet should read
  // oddly rather than vanish.
  test('shows a reason it does not know as it came', () => {
    const walked = result({ problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'moon-phase' }] });

    expect(bulkAddMinutesMessage(walked, 10)).toContain('Bravo (moon-phase)');
  });
});

describe('bulkAddMinutesRetryable', () => {
  // The grant hangs on this: kept, the same button is the retry; forgotten,
  // the next press is a second extension for every match the walk moved.
  test('is true for a match that threw, which asking again may well fix', () => {
    expect(bulkAddMinutesRetryable(result({
      extended: ['Alpha'],
      problems: [{ teamName: 'Bravo', matchID: 'm2', reason: 'error' }],
    }))).toBe(true);
  });

  // A refusal is a decision about the match, and comes back the same however
  // often it is asked — so holding the grant for it would only stand in the
  // way of the second extension the organiser may actually want.
  test.each(['no-match-running', 'other-match-running', 'match-not-found'])(
    'is false for %s, which will be refused again', (reason) => {
      expect(bulkAddMinutesRetryable(result({
        extended: ['Alpha'],
        problems: [{ teamName: 'Bravo', matchID: 'm2', reason }],
      }))).toBe(false);
    });

  test('is false for a walk that left nothing out', () => {
    expect(bulkAddMinutesRetryable(result({ extended: ['Alpha'] }))).toBe(false);
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

describe('bulkAddMinutesRetryMessage', () => {
  // The organiser has to know that the same button is the retry, or they go
  // looking for another way to give time the server may already have given.
  test('keeps what went wrong and says pressing again is safe', () => {
    const message = bulkAddMinutesRetryMessage('Váratlan hiba történt');

    expect(message).toContain('Váratlan hiba történt');
    expect(message).toContain('nyomd meg újra');
  });
});
