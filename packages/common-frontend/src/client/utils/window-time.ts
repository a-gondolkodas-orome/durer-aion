/// A moment as a start window takes it: ISO 8601 to the minute, in the
/// browser's time zone with its offset, e.g. `2026-11-13T12:56+01:00`. What
/// the window fields offer to fill in, so an organiser edits a valid time
/// instead of typing the format from memory.
export function windowTimeNow(now: Date = new Date()): string {
  const pad = (value: number) => String(Math.abs(value)).padStart(2, '0');
  const offset = -now.getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    + `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
}

/// A time of a start window as the admin page shows it: read out in the
/// browser's time zone, named, then as stored, e.g.
/// `2026. november 20. 15:00 CET (2026-11-20T15:00+01:00)`. The stored text is
/// what was typed and what the fields take; the reading says what it means here.
export function windowTimeText(time: string): string {
  const read = new Intl.DateTimeFormat('hu', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(time));
  return `${read} (${time})`;
}

/// A start window as the admin page shows it; none means any time.
export function windowText(window: { opensAt: string, closesAt?: string } | null): string {
  if (window === null) return 'bármikor';
  return window.closesAt === undefined
    ? `${windowTimeText(window.opensAt)} után`
    : `${windowTimeText(window.opensAt)} – ${windowTimeText(window.closesAt)}`;
}
