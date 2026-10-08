// The home page, `/jatekok/` and `/valto/` report to one umami website, so each carries its own
// copy of the tracker tag — the home page has no build step to share one through. A copy that
// drifts fails silently: a wrong website id files its visits under another site, and a domain
// that is not the one serving it makes the tracker send nothing at all, with no error anywhere.
// README.md § *Usage tracking* says what is tracked and why.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(`${repoRoot}${path}`, 'utf8');

const pages = [
  'pages/home/index.html',
  'apps/strategy-practice/index.html',
  'apps/relay-practise-frontend/index.html',
];

// The domain the Pages site is served from, as declared to GitHub.
const domain = read('pages/home/CNAME').trim();

/** The attributes of the page's umami script tag, or undefined when it has none. */
function umamiTag(html) {
  const tag = html.match(/<script\b[^>]*\bsrc="https:\/\/umami\.durerinfo\.hu\/script\.js"[^>]*>/)?.[0];
  if (!tag) return undefined;
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
}

describe('umami tracker tags', () => {
  const tags = Object.fromEntries(pages.map(page => [page, umamiTag(read(page))]));

  it.each(pages)('%s loads the tracker', page => {
    expect(tags[page]).toBeDefined();
  });

  it.each(pages)('%s tracks only on the domain the site is served from', page => {
    expect(tags[page]?.['data-domains']).toBe(domain);
  });

  it.each(pages)('%s respects Do Not Track', page => {
    expect(tags[page]?.['data-do-not-track']).toBe('true');
  });

  it('reports every page to the same umami website', () => {
    const ids = new Set(pages.map(page => tags[page]?.['data-website-id']));
    expect(ids.size).toBe(1);
  });
});
