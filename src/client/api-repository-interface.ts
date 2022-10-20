import { teams } from "../codes";
import { TeamModelDto } from "./dto/TeamStateDto";

export interface ClientRepository {
  getTeamState(
    guid: string,
  ): Promise<TeamModelDto>;
  joinWithCode(
    code: string,
  ): Promise<string>
}

export class RealClientRepository implements ClientRepository {
  async getTeamState(
    guid: string,
  ): Promise<TeamModelDto> {
    const team = teams.find(it=>it.joinCode == guid)
    if(team == null) {
      throw new Error('Nem létező kód');
    }

    return team as TeamModelDto;
  }

  async joinWithCode(
    code: string,
  ): Promise<string> {
    
    const team = teams.find(it=>it.joinCode == code)
      if(team == null) {
        throw new Error('Nem létező kód');
      }

    return team.joinCode as string;
  }
}
