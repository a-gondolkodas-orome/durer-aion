import { BOT_MOVE_PAUSE_MS, pacer } from './pace-bot-moves';

type Delivered = Parameters<Parameters<typeof pacer>[0]>[0];

const moveBy = (playerID: string, stateID: number) => ({
  type: 'update',
  args: ['match', { _stateID: stateID }, [{ action: { type: 'MAKE_MOVE', payload: { type: 'm', args: [], playerID } } }]],
}) as unknown as Delivered;

const team = (stateID: number) => moveBy('0', stateID);
const bot = (stateID: number) => moveBy('1', stateID);
const chat = { type: 'chat', args: ['match', { id: 'c', sender: '0', payload: 'hi' }] } as unknown as Delivered;

function shownAt() {
  const shown: [number, unknown][] = [];
  const start = Date.now();
  const show = pacer((data) => shown.push([Date.now() - start, data.type === 'update' ? (data.args[1] as { _stateID: number })._stateID : data.type]));
  return { show, shown };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('shows a bot turn sent at once one move at a time, behind the team\'s move', async () => {
  const { show, shown } = shownAt();
  show(team(1));
  show(bot(2));
  show(bot(3));
  await vi.advanceTimersByTimeAsync(3 * BOT_MOVE_PAUSE_MS);

  expect(shown).toStrictEqual([[0, 1], [BOT_MOVE_PAUSE_MS, 2], [2 * BOT_MOVE_PAUSE_MS, 3]]);
});

test('holds whatever comes behind a held move, in order', async () => {
  const { show, shown } = shownAt();
  show(team(1));
  show(bot(2));
  show(chat);
  show(team(3));
  expect(shown).toStrictEqual([[0, 1]]);
  await vi.advanceTimersByTimeAsync(BOT_MOVE_PAUSE_MS);

  expect(shown).toStrictEqual([[0, 1], [BOT_MOVE_PAUSE_MS, 2], [BOT_MOVE_PAUSE_MS, 'chat'], [BOT_MOVE_PAUSE_MS, 3]]);
});

test('holds nothing that comes after the pause anyway', async () => {
  const { show, shown } = shownAt();
  show(team(1));
  await vi.advanceTimersByTimeAsync(BOT_MOVE_PAUSE_MS + 100);
  show(bot(2));
  show(chat);

  expect(shown).toStrictEqual([[0, 1], [BOT_MOVE_PAUSE_MS + 100, 2], [BOT_MOVE_PAUSE_MS + 100, 'chat']]);
});
