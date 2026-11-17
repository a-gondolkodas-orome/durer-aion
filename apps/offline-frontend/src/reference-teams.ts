import type { CompetitionId } from "schemas";

// One test team per reference competition (reference.ts),
// which the /minta-verseny/ build serves in place of the rehearsed round. Its
// codes are not teamData.ts's, so neither build lets in the other's teams.
export const referenceTeams: {
  teamname: string,
  competitionId: CompetitionId,
  join_code: string
}[] = [
  { teamname: 'Minta teljes', competitionId: 'klmgbpb334--minta-teljes', join_code: '900-0000-000' },
  { teamname: 'Minta két lépés', competitionId: 'pc7jcwfdxr--minta-ketlepes', join_code: '901-0000-000' },
  { teamname: 'Minta sablon', competitionId: 'rn477ptnaf--minta-sablon', join_code: '902-0000-000' },
  { teamname: 'Minta váltó', competitionId: '49tbhzl1jz--minta-valto', join_code: '903-0000-000' },
];
