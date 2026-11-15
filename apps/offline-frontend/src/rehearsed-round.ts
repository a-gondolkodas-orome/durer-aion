import { createRegistry } from "problem-bank";
import * as rehearsedRound from "problem-bank/banks/edition-20-online";
import { judgeProblems } from "relay-bot";
import type { Problem } from "relay-bot";
import { publicCompetition } from "schemas";
import type { CompetitionId, PublicCompetition } from "schemas";

// The round the dry run rehearses, by its bank: the year's private repo names
// this year's here, and its test teams in teamData.ts.
const registry = createRegistry([rehearsedRound]);

/// A competition of the rehearsed round as the live round serves it to a
/// team; undefined for an id the round does not have.
export function dryRunCompetition(id: CompetitionId): PublicCompetition | undefined {
  const competition = registry.competitions.get(id);
  return competition && publicCompetition(competition);
}

/// The problems the bot judges a competition's relay by.
export function dryRunRelay(id: CompetitionId): Problem[] {
  const relay = registry.competitions.get(id)?.relay;
  const languages = registry.competitions.get(id)?.languages;
  if (relay === undefined || languages === undefined) {
    throw new Error(`The rehearsed round has no relay in ${id}`);
  }
  return judgeProblems(relay, languages, registry.problems);
}
