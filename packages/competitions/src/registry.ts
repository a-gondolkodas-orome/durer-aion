import type { CompetitionConfig, Problem } from 'schemas';
import { edition20OnlineCompetitions } from './configs/edition-20-online';
import { edition20OnlineProblems } from './problems/edition-20-online';
import { inCodeCompetitionSource, inCodeProblemSource } from './sources';

// Every competition and problem held in code. registry.test.ts validates them
// all, so one that breaks the rules fails CI rather than a round.
//
// This year's competitions, and the problems only they use, are added in the
// year's private repo until the competition is over (README § Competition
// secrecy); this public one holds rounds that are public already.

export const problems: readonly Problem[] = [
  ...edition20OnlineProblems,
];

export const competitions: readonly CompetitionConfig[] = [
  ...edition20OnlineCompetitions,
];

export const problemSource = inCodeProblemSource(problems);
export const competitionSource = inCodeCompetitionSource(competitions);
