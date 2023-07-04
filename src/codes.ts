import { TeamModelDto } from "./client/dto/TeamStateDto";
import { teamData } from "./teamData";

export const teams: TeamModelDto[] = teamData.map(team =>{ return{
  joinCode:team.join_code,
  category:team.category,
  name:team.teamname}
})