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

    if((guid.startsWith('C') || guid.startsWith('D') || guid.startsWith('E')) && guid.length > 1) {
      return {
        joinCode: guid,
        name: guid.substring(1),
        category: guid.substring(0, 1),
      };
    }
    const team = teams.find(it=>it.joinCode == guid)
    if(team == null) {
      throw new Error('Nem létező kód');
    }

    return team as TeamModelDto;
  }

  async joinWithCode(
    code: string,
  ): Promise<string> {
    if((code.startsWith('C') || code.startsWith('D') || code.startsWith('E')) && code.length > 1) {
      return code;
    }
    const team = teams.find(it=>it.joinCode == code)
      if(team == null) {
        throw new Error('Nem létező kód');
      }

    return team.joinCode as string;
  }
}
