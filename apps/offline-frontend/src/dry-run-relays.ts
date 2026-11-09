import { createRegistry } from "problem-bank";
import * as rehearsedRound from "problem-bank/banks/edition-20-online";
import { judgeProblems } from "relay-bot";
import type { Problem } from "relay-bot";
import type { CompetitionCategory } from "common-frontend/core";

// The round the dry run rehearses, by its bank: the year's private repo names
// this year's here. The dry run picks a team's relay by category until it
// follows the registry too (#137, step 10).
const registry = createRegistry([rehearsedRound]);

export function dryRunRelay(category: CompetitionCategory): Problem[] {
  const competition = [...registry.competitions.values()].find(({ metadata, relay }) =>
    metadata.kind === "competition" && metadata.category === category && relay !== undefined);
  if (competition?.relay === undefined) {
    throw new Error(`The rehearsed round has no relay in category ${category}`);
  }
  return judgeProblems(competition.relay, competition.languages, registry.problems);
}
