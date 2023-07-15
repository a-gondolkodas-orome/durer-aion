import { atom } from 'recoil';
import { TeamModelDto } from '../dto/TeamStateDto';

const RECOIL_KEY = 'team_status';

export const currentStateAtom = atom<TeamModelDto | null>({
    key: RECOIL_KEY,
    default: null
});
