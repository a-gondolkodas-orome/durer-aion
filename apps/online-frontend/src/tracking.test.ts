// @vitest-environment jsdom
import type { TeamModelDto } from "common-frontend";
import { Tracker } from "./tracking";

type MatchStatus = TeamModelDto["relayMatch"];

const notStarted: MatchStatus = { state: 'NOT STARTED' };
const inProgress = (matchID: string): MatchStatus =>
  ({ state: 'IN PROGRESS', matchID, startAt: new Date(), endAt: new Date() });
const finished = (matchID: string, score: number): MatchStatus =>
  ({ state: 'FINISHED', matchID, score, startAt: new Date(), endAt: new Date() });

const team = (relayMatch: MatchStatus, strategyMatch: MatchStatus = notStarted) => ({
  teamName: 'Never sent',
  category: 'C',
  credentials: '',
  pageState: 'HOME',
  competition: { metadata: { kind: 'competition', edition: 20, round: 'online', category: 'C' } },
  relayMatch,
  strategyMatch,
}) as TeamModelDto;

let track: ReturnType<typeof vi.fn>;
let identify: ReturnType<typeof vi.fn>;

const events = () => track.mock.calls;

beforeEach(() => {
  localStorage.clear();
  track = vi.fn();
  identify = vi.fn();
  window.umami = { track, identify } as unknown as Window['umami'];
  // jsdom has no matchMedia.
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

afterEach(() => {
  delete window.umami;
});

describe('the match events', () => {
  test('a start and its end are each sent once, with the category and year but not the team', () => {
    const tracker = new Tracker();
    tracker.observe(team(notStarted));
    tracker.started('relay');
    tracker.observe(team(inProgress('m1')));
    tracker.observe(team(inProgress('m1')));
    tracker.observe(team(finished('m1', 42)));
    tracker.observe(team(finished('m1', 42)));

    expect(events()).toStrictEqual([
      ['relay-started', { category: 'C', year: '20' }],
      ['relay-finished', { category: 'C', year: '20', points: 42 }],
    ]);
    expect(JSON.stringify([events(), identify.mock.calls])).not.toContain('Never sent');
  });

  // Another computer of the same team sees the match without having started it.
  test('a browser that did not start the match sends neither', () => {
    const tracker = new Tracker();
    tracker.observe(team(inProgress('m1')));
    tracker.observe(team(finished('m1', 42)));

    expect(events()).toStrictEqual([]);
  });

  test('the end is sent after a reload, from what the browser stored', () => {
    const before = new Tracker();
    before.started('strategy');
    before.observe(team(notStarted, inProgress('s1')));

    new Tracker().observe(team(notStarted, finished('s1', 9)));

    expect(events().at(-1)).toStrictEqual(['strategy-finished', { category: 'C', year: '20', points: 9 }]);
  });

  // A reloaded page fetches the team before the tracker has loaded; marking the
  // end as sent then would lose it.
  test('a team state from before the tracker loaded is sent once it has', () => {
    const before = new Tracker();
    before.started('relay');
    before.observe(team(inProgress('m1')));
    track.mockClear();

    delete window.umami;
    const tracker = new Tracker();
    tracker.observe(team(finished('m1', 42)));
    window.umami = { track, identify } as unknown as Window['umami'];
    tracker.observe(team(finished('m1', 42)));

    expect(events()).toStrictEqual([['relay-finished', { category: 'C', year: '20', points: 42 }]]);
  });
});

describe('the session data', () => {
  test('the device goes with the category, sent again only when the team changes', () => {
    const tracker = new Tracker();
    tracker.observe(team(notStarted));
    tracker.observe(team(notStarted));

    expect(identify.mock.calls).toStrictEqual([[{
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: '1',
      pointer: 'fine',
      category: 'C',
      year: '20',
    }]]);
  });
});

describe('the tracker tag', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    window.history.replaceState(null, '', '/');
  });

  test('is added with automatic tracking off', () => {
    new Tracker().load();

    expect(document.head.querySelector('script')?.dataset).toMatchObject({ domains: 'verseny.durerinfo.hu', autoTrack: 'false', doNotTrack: 'true' });
  });

  // The admin page's URL names a team's id, which is its session cookie.
  test('is not added on an admin page', () => {
    window.history.replaceState(null, '', '/admin/a-team-id');

    new Tracker().load();

    expect(document.head.querySelector('script')).toBeNull();
  });
});
