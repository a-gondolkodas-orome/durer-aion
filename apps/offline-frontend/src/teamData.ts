import type { CompetitionId } from "schemas";

// One test team per competition of the rehearsed round (rehearsed-round.ts).
export const teamData:{
  teamname: string,
  competitionId: CompetitionId,
  join_code: string
}[] = [
{ teamname: 'testC', competitionId: 'mkhi1nnoim--20-online-c', join_code: '100-0000-000' },
{ teamname: 'testD', competitionId: 'u4lw7pcca1--20-online-d', join_code: '200-0000-000' },
{ teamname: 'testE', competitionId: 'wkr6zml6mu--20-online-e', join_code: '300-0000-000' },
]
