import { describe, expect, test, vi } from 'vitest';
import { TeamModelDto } from '../dto/TeamStateDto';
import { addMinutesToRunningMatches, bulkAddMinutesMessage } from './bulk-add-minutes';

const START = new Date('2026-09-11T18:00:00.000Z');
const END = new Date('2026-09-11T19:00:00.000Z');

const running = (matchID: string) => ({ state: 'IN PROGRESS' as const, matchID, startAt: START, endAt: END });
const finished = (matchID: string) =>
  ({ state: 'FINISHED' as const, matchID, startAt: START, endAt: END, score: 12 });
const notStarted = { state: 'NOT STARTED' as const };

const team = (teamName: string, matches: Partial<TeamModelDto> = {}): TeamModelDto => ({
  teamName,
  category: 'C',
  credentials: 'credentials',
  pageState: 'HOME',
  relayMatch: notStarted,
  strategyMatch: notStarted,
  ...matches,
});

describe('addMinutesToRunningMatches', () => {
  test('extends every running match, and leaves the others alone', async () => {
    const addMinutes = vi.fn().mockResolvedValue('OK');
    const teams = [
      team('Alpha', { relayMatch: running('relay-a') }),
      team('Bravo', { relayMatch: finished('relay-b'), strategyMatch: running('strategy-b') }),
      team('Charlie'),
    ];

    const result = await addMinutesToRunningMatches(teams, 10, addMinutes);

    expect(result).toStrictEqual({ extended: 2, failures: [] });
    expect(addMinutes.mock.calls).toStrictEqual([['relay-a', 10], ['strategy-b', 10]]);
  });

  // The defect this file is about: one `try` around the whole walk meant the
  // first refused match cost every team after it their extension, mid-round.
  test('a refused match does not cost the teams after it their minutes', async () => {
    const addMinutes = vi.fn()
      .mockResolvedValueOnce('OK')
      .mockRejectedValueOnce(new Error('Lejárt játékot már nem lehet módosítani'))
      .mockResolvedValueOnce('OK');
    const teams = [
      team('Alpha', { relayMatch: running('relay-a') }),
      team('Bravo', { relayMatch: running('relay-b') }),
      team('Charlie', { relayMatch: running('relay-c') }),
    ];

    const result = await addMinutesToRunningMatches(teams, 10, addMinutes);

    expect(addMinutes).toHaveBeenCalledTimes(3);
    expect(result).toStrictEqual({
      extended: 2,
      failures: [{ teamName: 'Bravo', message: 'Lejárt játékot már nem lehet módosítani' }],
    });
  });

  // Both of a team's matches can be running at once, and the server answers the
  // second of them separately, so neither may swallow the other.
  test('reports both of a team\u2019s running matches on their own', async () => {
    const addMinutes = vi.fn()
      .mockRejectedValueOnce(new Error('Váratlan hiba történt'))
      .mockResolvedValueOnce('OK');

    const result = await addMinutesToRunningMatches(
      [team('Alpha', { relayMatch: running('relay-a'), strategyMatch: running('strategy-a') })],
      5,
      addMinutes,
    );

    expect(addMinutes.mock.calls).toStrictEqual([['relay-a', 5], ['strategy-a', 5]]);
    expect(result).toStrictEqual({
      extended: 1,
      failures: [{ teamName: 'Alpha', message: 'Váratlan hiba történt' }],
    });
  });

  test('a rejection that is not an Error still names the team', async () => {
    const addMinutes = vi.fn().mockRejectedValue('nope');

    const result = await addMinutesToRunningMatches(
      [team('Alpha', { relayMatch: running('relay-a') })],
      5,
      addMinutes,
    );

    expect(result.failures).toStrictEqual([{ teamName: 'Alpha', message: 'Váratlan hiba történt' }]);
  });

  test('an empty list asks the server nothing', async () => {
    const addMinutes = vi.fn();

    expect(await addMinutesToRunningMatches([], 10, addMinutes)).toStrictEqual({ extended: 0, failures: [] });
    expect(addMinutes).not.toHaveBeenCalled();
  });
});

describe('bulkAddMinutesMessage', () => {
  test('says how many got the minutes when every match took them', () => {
    expect(bulkAddMinutesMessage({ extended: 3, failures: [] }, 10))
      .toBe('3 meccs kapott +10 percet');
  });

  // Naming them is the point: the organiser could not tell which teams were
  // left out, and pressing the button again gives the rest the minutes twice.
  test('names every team that was left out, and what it was told', () => {
    const result = {
      extended: 1,
      failures: [
        { teamName: 'Bravo', message: 'Lejárt játékot már nem lehet módosítani' },
        { teamName: 'Charlie', message: 'Váratlan hiba történt' },
      ],
    };

    expect(bulkAddMinutesMessage(result, 10)).toBe(
      '1 meccs kapott +10 percet, 2 sikertelen: '
      + 'Bravo (Lejárt játékot már nem lehet módosítani), Charlie (Váratlan hiba történt)');
  });
});
