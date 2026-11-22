import { createRegistry } from "problem-bank";
import * as rehearsedRound from "problem-bank/banks/edition-20-online";
import * as reference from "problem-bank/banks/reference";
import { judgeProblems } from "relay-bot";
import type { Problem } from "relay-bot";
import { publicCompetition } from "schemas";
import type { CompetitionId, PublicCompetition } from "schemas";
import { referenceTeams } from "./reference-teams";
import { teamData } from "./teamData";

// The round the dry run rehearses, by its bank: the year's private repo names
// this year's here, and its test teams in teamData.ts. A build with
// VITE_DRY_RUN_ROUND=reference serves the reference competitions instead, at
// /minta-verseny/ (scripts/assemble-site.mjs). The variable is inlined at build
// time, so each build bundles one of the two banks only.
export const servesReference = import.meta.env.VITE_DRY_RUN_ROUND === "reference";

const registry = createRegistry([servesReference ? reference : rehearsedRound]);

/// The test teams that may log in, each with its competition's id.
export const dryRunTeams = servesReference ? referenceTeams : teamData;

/// A competition of the round as the live round serves it to a team;
/// undefined for an id the round does not have.
export function dryRunCompetition(id: CompetitionId): PublicCompetition | undefined {
  const competition = registry.competitions.get(id);
  return competition && publicCompetition(competition);
}

/// The problems the bot judges a competition's relay by.
export function dryRunRelay(id: CompetitionId): Problem[] {
  const relay = registry.competitions.get(id)?.relay;
  const languages = registry.competitions.get(id)?.languages;
  if (relay === undefined || languages === undefined) {
    throw new Error(`The dry run's round has no relay in ${id}`);
  }
  return judgeProblems(relay, languages, registry.problems);
}
