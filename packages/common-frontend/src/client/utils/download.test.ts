// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { downloadTsv } from './download';

// jsdom has no object URLs and no real download — and a real anchor's click()
// there is a navigation it then reports on the run's output. So the anchor is
// a stand-in, and what the test watches is the order of what happens to it.
function stubDownload() {
  const events: string[] = [];
  URL.createObjectURL = vi.fn(() => 'blob:codes');
  URL.revokeObjectURL = vi.fn((url: string) => { events.push(`revoke ${url}`); });
  const anchor = { href: '', download: '', click: () => { events.push('click'); } };
  vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement);
  return { events, anchor };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('downloadTsv', () => {
  // Revoking in the same task as the click cancels the download in a browser
  // that reads the blob asynchronously, and cancels it silently: the caller
  // sees no throw, so the team import reported success with no file saved.
  test('leaves the object URL alive until the click has had a turn', () => {
    vi.useFakeTimers();
    const { events, anchor } = stubDownload();

    downloadTsv('codes.tsv', 'teamName\tjoinCode\n');

    expect(anchor.download).toBe('codes.tsv');
    expect(events).toEqual(['click']);

    vi.runAllTimers();

    expect(events).toEqual(['click', 'revoke blob:codes']);
  });
});
