import { registry } from 'problem-bank/all';
import { resolveRelay } from 'problem-bank';
import { relayProblems } from 'relay-bot';
import type { Problem as RelayBotProblem } from 'relay-bot';
import type { RelayConfig } from 'schemas';

// Until the live round runs on competitions (#137), its judge reads
// `relay-bot`'s own copy of the problems, and the bank holds them a second
// time. This holds the two to each other, so a fix made in one copy only fails
// here rather than splitting what a team is judged by from what the bank says.
// It goes with `relay-bot`'s copy.
//
// Each of `relay-bot`'s category lists must be the relay of some registered
// competition in that category. In the year's private repo that is this year's
// round, so it fails there until the round is in the registry too.

async function asRelayBotList(competitionRelay: RelayConfig) {
  const resolved = await resolveRelay(competitionRelay, registry.problemSource);
  return resolved.map(({ problem, points }): RelayBotProblem => {
    const content = problem.content.hu;
    if (content === undefined) throw new Error(`${problem.id} has no Hungarian text, which relay-bot's always is`);
    const { problemText, imageUrl, help1, help2 } = content;
    return {
      problemText,
      answer: problem.answer,
      points,
      ...(imageUrl !== undefined && { url: imageUrl }),
      ...(help1 !== undefined && { help1 }),
      ...(help2 !== undefined && { help2 }),
    };
  });
}

describe("relay-bot's copy of the problems", () => {
  it.each(Object.entries(relayProblems))('matches a registered competition in category %s', async (category, list) => {
    const relays = registry.competitions.flatMap(({ metadata, relay }) =>
      metadata.kind === 'competition' && metadata.category === category && relay !== undefined ? [relay] : []);
    const lists = await Promise.all(relays.map(asRelayBotList));
    expect(lists).toContainEqual(list);
  });
});
