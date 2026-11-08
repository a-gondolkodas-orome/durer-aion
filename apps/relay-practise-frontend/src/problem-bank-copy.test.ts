import { registry } from 'problem-bank/all';
import { resolveRelay } from 'problem-bank';
import { relayProblems } from 'relay-bot';
import type { Problem as RelayBotProblem } from 'relay-bot';
import { problems as practiceProblems } from './problems';

// Until the live round and this site run on competitions (#137), two copies of
// edition XX's online problems sit beside the bank: `relay-bot`'s, which the
// live round's judge reads, and this site's own `20_O_*` sets. This holds both
// to the bank, so a fix made in one copy only fails here rather than splitting
// what a team is judged by, or practises on, from what the bank says. Each
// check goes with its copy.
//
// Each list must be the relay of some registered competition in its category.
// In the year's private repo `relay-bot`'s lists are this year's round, so the
// first check fails there until the round is in the registry too.

async function asRelayBotList(competitionRelay: Parameters<typeof resolveRelay>[0]) {
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

function relaysInCategory(category: string, edition?: number) {
  return Promise.all([...registry.competitions.values()].flatMap(({ metadata, relay }) =>
    metadata.kind === 'competition' && metadata.category === category
      && (edition === undefined || metadata.edition === edition) && relay !== undefined
      ? [asRelayBotList(relay)]
      : []));
}

describe("relay-bot's copy of the problems", () => {
  it.each(Object.entries(relayProblems))('matches a registered competition in category %s', async (category, list) => {
    expect(await relaysInCategory(category)).toContainEqual(list);
  });
});

describe("the practice site's copy of edition XX's online round", () => {
  it.each(['C', 'D', 'E'])('matches its category %s competition', async (category) => {
    expect(await relaysInCategory(category, 20)).toEqual([practiceProblems[`20_O_${category}`]]);
  });
});
