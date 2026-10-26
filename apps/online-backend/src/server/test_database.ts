import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { PostgresStore } from 'bgio-postgres';
import { TeamsRepository } from './db';

/**
 * A real postgres for a suite, with no docker: PGlite is the postgres engine
 * compiled to WASM, in this process, and the socket server speaks the wire
 * protocol on a loopback port, so `pg` and Sequelize connect to it the way they
 * connect to the production database.
 *
 * The socket server takes one connection, and PGlite runs one session behind
 * it, so the pool holds one connection and a suite cannot show a race between
 * two. A statement that escapes its transaction waits for that connection
 * forever, so the short `acquire` turns the hang into a
 * `ConnectionAcquireTimeoutError`.
 */
export async function startTestDatabase() {
  const pglite = await PGlite.create();
  const server = new PGLiteSocketServer({ db: pglite, port: 0 });
  await server.start();
  const db = new PostgresStore(`postgres://postgres@${server.getServerConn()}/postgres`, {
    logging: false,
    pool: { max: 1, acquire: 1_000 },
  });
  const teams = new TeamsRepository(db);
  // Syncs every model on this Sequelize, the teams' tables included.
  await db.connect();
  return {
    db,
    teams,
    /** Empties the teams, their archive and the matches, for a test that starts from nothing. */
    async reset() {
      await db.sequelize.query('TRUNCATE "Teams", "DeletedTeams", "Games"');
    },
    async stop() {
      await db.sequelize.close();
      await server.stop();
      await pglite.close();
    },
  };
}
