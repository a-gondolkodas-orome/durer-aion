// @vitest-environment jsdom
//
// Against a real `Local` transport and a real localStorage: what is under test
// is boardgame.io's in-memory master, which a stub would not have (#742).
import { Client } from 'boardgame.io/client';
import type { Game } from 'boardgame.io';
import { localWithBots } from '../../common/local-with-bots';
import { matchStorageKey } from './storage-keys';
import { clearStoredSession, perStoredSession } from './stored-session';

interface TestState {
  marks: string[];
}

/// One player, so a move is all it takes to change the saved match.
const testGame: Game<TestState> = {
  name: 'stored-session-test',
  setup: () => ({ marks: [] }),
  moves: {
    mark: ({ G }, who: string) => { G.marks.push(who); },
  },
};

/// What a local app builds per category: a client component, here what it
/// mounts. Every mount shares the game object, which keys the master.
function buildClient(key: string) {
  const game = { ...testGame };
  const multiplayer = localWithBots({ bots: {}, storageKey: matchStorageKey(key) });
  return () => Client<TestState>({ game, multiplayer, numPlayers: 1, playerID: '0' });
}

const marksOf = (client: ReturnType<ReturnType<typeof buildClient>>) =>
  (client.getState()?.G as TestState).marks;

/// The master answers the client asynchronously.
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

/// A mount: a client that plays on whatever its master holds.
async function mount(makeClient: ReturnType<typeof buildClient>) {
  const client = makeClient();
  client.start();
  await settle();
  return client;
}

async function markAndLeave(client: ReturnType<ReturnType<typeof buildClient>>, who: string) {
  client.moves.mark(who);
  await settle();
  expect(marksOf(client)).toContain(who);
  client.stop();
}

beforeEach(() => {
  localStorage.clear();
});

describe('a client built per stored session', () => {
  // The regression: the dry run built its clients once per page, so a team
  // logging in after a logout on the same tab played on in the previous
  // team's match, held in the master's memory after its storage was cleared.
  test('gives the next team on the tab a fresh match', async () => {
    const clientOf = perStoredSession(buildClient);
    await markAndLeave(await mount(clientOf('C')), 'first team');

    clearStoredSession();
    const next = await mount(clientOf('C'));

    expect(marksOf(next)).toStrictEqual([]);
    next.stop();
  });

  test('stays the same within a session, so a remount continues the match', async () => {
    const clientOf = perStoredSession(buildClient);
    expect(clientOf('C')).toBe(clientOf('C'));
    expect(clientOf('C')).not.toBe(clientOf('D'));

    await markAndLeave(await mount(clientOf('C')), 'team');
    const remounted = await mount(clientOf('C'));

    expect(marksOf(remounted)).toStrictEqual(['team']);
    remounted.stop();
  });

  // A reload is a new page, hence a new client and master, which must still
  // find the team's own match where the transport saved it.
  test('leaves the match saved for a reload', async () => {
    clearStoredSession();
    await markAndLeave(await mount(perStoredSession(buildClient)('C')), 'next team');

    const afterReload = await mount(perStoredSession(buildClient)('C'));

    expect(marksOf(afterReload)).toStrictEqual(['next team']);
    afterReload.stop();
  });
});
