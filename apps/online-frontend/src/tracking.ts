/*
What the competition reports to umami (README § Usage tracking). Every call
here is a no-op while `window.umami` is absent: the tracker has not loaded, or
could not. Under Do Not Track, or on any domain but the competition's, the
tracker drops the call itself.

The tracker tag is added from here rather than written in index.html: a
deferred script there runs before the app's, so a slow umami server would hold
up the competition page. Automatic tracking is off, and an admin page loads no
tracker at all: its URL holds a team's id, which is the team's session cookie
(`team_view.ts` in the backend), and every umami request carries the page's URL.
*/

import i18next from "i18next";
import { setUsageReporter } from "common-frontend/core";
import type { TeamModelDto } from "common-frontend";

declare global {
  interface Window {
    umami?: {
      track: (name?: string, data?: Record<string, unknown>) => void;
      identify: (data: Record<string, unknown>) => void;
    };
  }
}

const umami = () => window.umami;

const isAdminPage = () => window.location.pathname.includes('/admin');

// The same three properties the practice sites' tags send.
const device = () => ({
  viewport: window.innerWidth + 'x' + window.innerHeight,
  pixelRatio: String(Math.round(window.devicePixelRatio * 100) / 100),
  pointer: window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine',
});

// The year goes as a string: it is a label to group by, and umami shows a
// number with four decimals. Never the team's name: the category is as fine as
// a breakdown needs to be.
const teamData = (team: TeamModelDto) => ({
  category: team.category,
  ...(team.competition?.metadata.kind === 'competition' && { year: String(team.competition.metadata.edition) }),
});

type MatchKind = 'relay' | 'strategy';

// Which matches this browser started, and whether their end has been sent:
// one start succeeds per match, so counting only on the browser that started
// it sends each start and each end once, however many computers the team
// follows it on. A matchID is a fresh id per match, so entries left from
// another team at the same computer do nothing.
const STORAGE_KEY = 'trackedMatches';
type MatchRecord = Record<string, 'started' | 'finished'>;

const readRecord = (): MatchRecord => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed as MatchRecord : {};
  } catch {
    return {};
  }
};

export class Tracker {
  // A start the server accepted, whose match id the next team state names.
  private pending = new Set<MatchKind>();
  private team: TeamModelDto | null = null;
  private identifiedAs: string | null = null;

  load() {
    if (isAdminPage()) return;
    const script = document.createElement('script');
    script.src = 'https://umami.durerinfo.hu/script.js';
    script.dataset.websiteId = 'b9048f72-0c17-4aa5-962b-076c0907aaba';
    script.dataset.domains = 'verseny.durerinfo.hu';
    script.dataset.doNotTrack = 'true';
    script.dataset.autoTrack = 'false';
    script.onload = () => {
      this.identify();
      umami()?.track();
      // A team state that came before the tracker is caught up on now.
      this.observe(this.team);
    };
    document.head.append(script);
    i18next.on('languageChanged', () => this.identify());
    // A connection drop or a crash, from the shared screens: with the
    // team's page, which says which match it happened in.
    setUsageReporter((event, data) => {
      umami()?.track(event, {
        ...(this.team && { ...teamData(this.team), page: this.team.pageState }),
        ...data,
      });
    });
  }

  // A session keeps the latest values identify sent, so the device's go
  // along each time; sent again only when the team's or the language change.
  private identify() {
    const tracker = umami();
    if (!tracker) return;
    const data = { ...(this.team && teamData(this.team)), language: i18next.language };
    const identity = JSON.stringify(data);
    if (identity === this.identifiedAs) return;
    this.identifiedAs = identity;
    tracker.identify({ ...device(), ...data });
  }

  login() {
    umami()?.track('login');
  }

  started(kind: MatchKind) {
    this.pending.add(kind);
  }

  // Called with every team state the server answers.
  observe(team: TeamModelDto | null) {
    this.team = team;
    const tracker = umami();
    if (team === null || !tracker) return;
    this.identify();
    const data = teamData(team);
    const record = readRecord();
    let changed = false;
    for (const kind of ['relay', 'strategy'] as const) {
      const match = kind === 'relay' ? team.relayMatch : team.strategyMatch;
      if (match.state === 'IN PROGRESS' && this.pending.has(kind)) {
        this.pending.delete(kind);
        if (record[match.matchID] === undefined) {
          record[match.matchID] = 'started';
          changed = true;
          tracker.track(`${kind}-started`, data);
        }
      }
      if (match.state === 'FINISHED' && record[match.matchID] === 'started') {
        record[match.matchID] = 'finished';
        changed = true;
        tracker.track(`${kind}-finished`, { ...data, points: match.score });
      }
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    }
  }
}

export const tracker = new Tracker();
