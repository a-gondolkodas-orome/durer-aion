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
