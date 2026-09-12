import { afterEach, describe, expect, it, vi } from 'vitest';
import * as http from 'node:http';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import type { AddressInfo } from 'node:net';
import Koa from 'koa';
import Router from '@koa/router';
import type { Server } from 'boardgame.io';
import { TEAM_IMPORT_HEADER } from 'schemas';
import { TeamsRepository } from './db';
import { ADMIN_USER, requireAdmin } from './admin_session';
import { configureTeamsRouter } from './router';

const HEADER = TEAM_IMPORT_HEADER.join('\t');
const TSV = [HEADER, ['Alpha', 'C', 'a@b.com', 'x', '', '', ''].join('\t')].join('\n');

// The route over HTTP, the way team_remove.test.ts serves it: a real router on a
// loopback port, over a repository that is a stub.
describe('PUT /team/admin/import', () => {
  const PASSWORD = 'organiser-password';
  const CREDENTIALS = `Basic ${Buffer.from(`${ADMIN_USER}:${PASSWORD}`).toString('base64')}`;
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  const stubTeams = () => ({
    takenIdentifiers: vi.fn().mockResolvedValue({
      teamIds: new Set<string>(), teamNames: new Set<string>(), joinCodes: new Set<string>(),
    }),
    insertTeams: vi.fn().mockResolvedValue(null),
  }) as unknown as TeamsRepository;

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The refusals are what is under test, and koa logs every error it writes.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin(PASSWORD));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    return (body: string, init: { query?: string, contentType?: string | null, auth?: boolean } = {}) => {
      const headers: Record<string, string> = {};
      if (init.auth !== false) headers.authorization = CREDENTIALS;
      if (init.contentType !== null) headers['content-type'] = init.contentType ?? 'text/tab-separated-values';
      return fetch(`http://127.0.0.1:${port}/team/admin/import${init.query ?? ''}`,
        { method: 'PUT', headers, body });
    };
  }

  it('hands the importer the body exactly as it was sent', async () => {
    const teams = stubTeams();
    const put = await serve(teams);
    // A body no multipart parser is in the way of: the tabs, the trailing
    // newline and the accents are what the importer must see.
    const body = `${HEADER}\nAlpha\tC\ta@b.com\tKovács Anna — Példa Gimnázium\t\t\t\n`;

    const response = await put(body);

    expect(response.status).toBe(200);
    const result = await response.json() as { imported: number, exportTable: string[][] };
    expect(result.imported).toBe(1);
    expect(result.exportTable[0][3]).toBe('Kovács Anna — Példa Gimnázium');
  });

  it('answers 401 without the organisers\' password', async () => {
    const teams = stubTeams();
    const put = await serve(teams);

    const response = await put(TSV, { auth: false });

    expect(response.status).toBe(401);
    expect(teams.insertTeams).not.toHaveBeenCalled();
  });

  // The regression this route was rewritten for: as a multipart upload it left
  // the file — every join code in it, which is every team's login secret — in
  // the OS temp directory under a name formidable chose, and nothing ever
  // unlinked it. formidable names those `upload_*`.
  it('leaves no copy of the file in the temp directory', async () => {
    const uploads = () => readdirSync(tmpdir()).filter(name => name.startsWith('upload_'));
    const before = uploads();
    const put = await serve(stubTeams());
    const boundary = 'boundary';
    const multipart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="teams.tsv"',
      'Content-Type: text/tab-separated-values',
      '',
      TSV,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    // Sent the way the old route wanted it, which is now refused outright.
    const response = await put(multipart, { contentType: `multipart/form-data; boundary=${boundary}` });

    expect(response.status).toBe(415);
    expect(uploads()).toEqual(before);
  });

  it('imports without writing a file', async () => {
    const uploads = () => readdirSync(tmpdir()).filter(name => name.startsWith('upload_'));
    const before = uploads();
    const put = await serve(stubTeams());

    await put(TSV);

    expect(uploads()).toEqual(before);
  });

  describe('refuses a body it cannot read', () => {
    it('answers 415 for JSON', async () => {
      const teams = stubTeams();
      const put = await serve(teams);

      const response = await put(JSON.stringify({ tsv: TSV }), { contentType: 'application/json' });

      expect(response.status).toBe(415);
      expect(teams.insertTeams).not.toHaveBeenCalled();
    });

    it('answers 415 with no content type at all', async () => {
      const put = await serve(stubTeams());

      const response = await put(TSV, { contentType: null });

      expect(response.status).toBe(415);
    });

    it('answers 400 for an empty body', async () => {
      const teams = stubTeams();
      const put = await serve(teams);

      const response = await put('   \n  ');

      expect(response.status).toBe(400);
      expect(teams.insertTeams).not.toHaveBeenCalled();
    });

    // 8 MB is the cap; the answer has to say so rather than fail as a 500 or
    // hang with the connection half read.
    it('answers 413 for a body over the limit', async () => {
      const put = await serve(stubTeams());
      const huge = [HEADER, ...Array.from(
        { length: 40_000 },
        (_, index) => `Team ${index}\tC\ta@b.com\t${'x'.repeat(250)}\t\t\t`,
      )].join('\n');

      const response = await put(huge);

      expect(response.status).toBe(413);
    });
  });

  describe('dryRun', () => {
    it('checks the file and writes nothing', async () => {
      const teams = stubTeams();
      const put = await serve(teams);

      const response = await put(TSV, { query: '?dryRun=1' });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ imported: 0, rows: 1, problems: [] });
      expect(teams.insertTeams).not.toHaveBeenCalled();
    });

    // Otherwise a typo in the flag writes the file it was asked to test.
    it('refuses a value it does not know rather than importing', async () => {
      const teams = stubTeams();
      const put = await serve(teams);

      const response = await put(TSV, { query: '?dryRun=yes' });

      expect(response.status).toBe(400);
      expect(teams.insertTeams).not.toHaveBeenCalled();
    });

    it('imports when the flag is absent', async () => {
      const teams = stubTeams();
      const put = await serve(teams);

      await put(TSV);

      expect(teams.insertTeams).toHaveBeenCalledTimes(1);
    });
  });
});
